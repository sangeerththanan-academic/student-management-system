const pool = require("../config/db");

const findStudentByEmail = async (email) => {
    const [rows] = await pool.execute(
        `SELECT u.user_id, u.username, s.email
         FROM users u
         INNER JOIN students s ON s.user_id = u.user_id
         WHERE LOWER(s.email) = LOWER(?)
           AND u.role = 'STUDENT'
         LIMIT 1`,
        [email]
    );

    return rows[0];
};

const isRecentlySent = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT user_id
         FROM password_reset_otps
         WHERE user_id = ?
           AND last_sent_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
         LIMIT 1`,
        [userId]
    );

    return rows.length > 0;
};

const saveOtp = async (userId, otpHash) => {
    await pool.execute(
        `INSERT INTO password_reset_otps
            (user_id, otp_hash, expires_at, attempts, last_sent_at,
             verified_at, reset_token_hash, reset_token_expires_at)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0, NOW(),
                 NULL, NULL, NULL)
         ON DUPLICATE KEY UPDATE
            otp_hash = VALUES(otp_hash),
            expires_at = VALUES(expires_at),
            attempts = 0,
            last_sent_at = NOW(),
            verified_at = NULL,
            reset_token_hash = NULL,
            reset_token_expires_at = NULL`,
        [userId, otpHash]
    );
};

const deleteOtp = async (userId) => {
    await pool.execute(
        "DELETE FROM password_reset_otps WHERE user_id = ?",
        [userId]
    );
};

const findActiveOtp = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT user_id, otp_hash, attempts
         FROM password_reset_otps
         WHERE user_id = ?
           AND expires_at > NOW()
           AND verified_at IS NULL
           AND attempts < 3
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};

const increaseOtpAttempts = async (userId) => {
    const [result] = await pool.execute(
        `UPDATE password_reset_otps
         SET attempts = attempts + 1
         WHERE user_id = ?
           AND verified_at IS NULL`,
        [userId]
    );

    return result;
};

const saveResetToken = async (userId, tokenHash) => {
    await pool.execute(
        `UPDATE password_reset_otps
         SET verified_at = NOW(),
             reset_token_hash = ?,
             reset_token_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
         WHERE user_id = ?`,
        [tokenHash, userId]
    );
};

const findValidResetToken = async (tokenHash) => {
    const [rows] = await pool.execute(
        `SELECT user_id
         FROM password_reset_otps
         WHERE reset_token_hash = ?
           AND verified_at IS NOT NULL
           AND reset_token_expires_at > NOW()
         LIMIT 1`,
        [tokenHash]
    );

    return rows[0];
};

const updatePasswordAndDeleteToken = async (userId, passwordHash) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.execute(
            `UPDATE users
             SET password_hash = ?
             WHERE user_id = ?
               AND role = 'STUDENT'`,
            [passwordHash, userId]
        );

        if (result.affectedRows !== 1) {
            throw new Error("Student password could not be updated");
        }

        await connection.execute(
            "DELETE FROM password_reset_otps WHERE user_id = ?",
            [userId]
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    findStudentByEmail,
    isRecentlySent,
    saveOtp,
    deleteOtp,
    findActiveOtp,
    increaseOtpAttempts,
    saveResetToken,
    findValidResetToken,
    updatePasswordAndDeleteToken
};