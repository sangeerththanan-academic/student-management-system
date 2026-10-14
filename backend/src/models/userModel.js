const crypto = require("crypto");
const pool = require("../config/db");

const findUserByUsername = async (username) => {
    const [rows] = await pool.execute(
        "SELECT user_id, username, password_hash, role FROM users WHERE username = ? LIMIT 1",
        [username]
    );

    return rows[0];
};

const findUserById = async (userId) => {
    const [rows] = await pool.execute(
        "SELECT user_id, username, role FROM users WHERE user_id = ? LIMIT 1",
        [userId]
    );

    return rows[0];
};

const findUserByEmail = async (email) => {
    const [rows] = await pool.execute(
        "SELECT user_id, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
        [email]
    );

    return rows[0];
};

const createPasswordResetOtp = async (userId, otpHash, expiresAt) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // A new OTP invalidates any earlier unused OTP for this account.
        await connection.execute(
            "UPDATE password_reset_otps SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL",
            [userId]
        );

        await connection.execute(
            `INSERT INTO password_reset_otps
                (user_id, otp_hash, expires_at, attempts, used_at)
             VALUES (?, ?, ?, 0, NULL)`,
            [userId, otpHash, expiresAt]
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/*
 * Verifies the latest OTP and updates the password in one transaction.
 * An OTP is single-use, expires after 10 minutes, and allows at most 5 attempts.
 */
const resetPasswordWithOtp = async (email, suppliedOtpHash, passwordHash) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            `SELECT
                otp.id,
                otp.user_id,
                otp.otp_hash,
                otp.expires_at,
                otp.used_at,
                otp.attempts
             FROM password_reset_otps AS otp
             INNER JOIN users AS u ON u.user_id = otp.user_id
             WHERE LOWER(u.email) = LOWER(?)
             ORDER BY otp.created_at DESC, otp.id DESC
             LIMIT 1
             FOR UPDATE`,
            [email]
        );

        const record = rows[0];

        if (!record || record.used_at || new Date(record.expires_at) <= new Date()) {
            await connection.rollback();
            return { success: false };
        }

        if (record.attempts >= 5) {
            await connection.execute(
                "UPDATE password_reset_otps SET used_at = NOW() WHERE id = ?",
                [record.id]
            );
            await connection.commit();
            return { success: false };
        }

        const expected = Buffer.from(record.otp_hash, "hex");
        const supplied = Buffer.from(suppliedOtpHash, "hex");
        const matches =
            expected.length === supplied.length &&
            crypto.timingSafeEqual(expected, supplied);

        if (!matches) {
            await connection.execute(
                "UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = ?",
                [record.id]
            );
            await connection.commit();
            return { success: false };
        }

        await connection.execute(
            "UPDATE users SET password_hash = ? WHERE user_id = ?",
            [passwordHash, record.user_id]
        );

        await connection.execute(
            "UPDATE password_reset_otps SET used_at = NOW() WHERE id = ?",
            [record.id]
        );

        // Invalidate every other active OTP for this user as well.
        await connection.execute(
            "UPDATE password_reset_otps SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL",
            [record.user_id]
        );

        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    findUserByUsername,
    findUserById,
    findUserByEmail,
    createPasswordResetOtp,
    resetPasswordWithOtp
};