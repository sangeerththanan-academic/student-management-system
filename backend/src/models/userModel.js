
const pool = require("../config/db");

// Find user by username
const findUserByUsername = async (username) => {
    const [rows] = await pool.execute(
        `SELECT user_id, username, email, password_hash, role
         FROM users
         WHERE username = ?
         LIMIT 1`,
        [username]
    );

    return rows[0];
};

// Find user by ID
const findUserById = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT user_id, username, email, role
         FROM users
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// Find user by registered email
const findUserByEmail = async (email) => {
    const [rows] = await pool.execute(
        `SELECT
            u.user_id,
            u.username,
            COALESCE(
                NULLIF(TRIM(s.email), ''),
                NULLIF(TRIM(u.email), '')
            ) AS email
         FROM users u
         LEFT JOIN students s ON s.user_id = u.user_id
         WHERE LOWER(TRIM(COALESCE(
             NULLIF(TRIM(s.email), ''),
             NULLIF(TRIM(u.email), '')
         ))) = ?
         LIMIT 1`,
        [email]
    );

    return rows[0];
};

// CR-006: Update last successful login time
const updateLastLogin = async (userId) => {
    try {
        const [result] = await pool.execute(
            "UPDATE users SET last_login = NOW() WHERE user_id = ?",
            [userId]
        );

        console.log("Last login update:", {
            userId,
            affectedRows: result.affectedRows
        });

        return result;
    } catch (error) {
        console.error("Last login update error:", error);
        throw error;
    }
};

// Create OTP record
const createPasswordResetOTP = async (
    userId,
    otpHash,
    expiresAt
) => {
    const [result] = await pool.execute(
        `INSERT INTO password_reset_otps
         (user_id, otp_hash, expires_at)
         VALUES (?, ?, ?)`,
        [userId, otpHash, expiresAt]
    );

    return result.insertId;
};

// Find the latest OTP for a user, including its attempt count.
const findPasswordResetOTP = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT id, user_id, otp_hash, expires_at, used_at, attempts
         FROM password_reset_otps
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// Count failed attempts so short numeric OTPs cannot be brute-forced.
const incrementPasswordResetOTPAttempts = async (otpId) => {
    const [result] = await pool.execute(
        `UPDATE password_reset_otps
         SET attempts = attempts + 1
         WHERE id = ? AND used_at IS NULL`,
        [otpId]
    );

    return result;
};

// Invalidate previous unused OTPs
const invalidatePasswordResetOTPs = async (userId) => {
    const [result] = await pool.execute(
        `UPDATE password_reset_otps
         SET used_at = NOW()
         WHERE user_id = ? AND used_at IS NULL`,
        [userId]
    );

    return result;
};

// Update password
const updatePassword = async (userId, passwordHash) => {
    const [result] = await pool.execute(
        `UPDATE users
         SET password_hash = ?
         WHERE user_id = ?`,
        [passwordHash, userId]
    );

    return result;
};

// Mark OTP as used
const markPasswordResetOTPUsed = async (otpId) => {
    const [result] = await pool.execute(
        `UPDATE password_reset_otps
         SET used_at = NOW()
         WHERE id = ? AND used_at IS NULL`,
        [otpId]
    );

    return result;
};

module.exports = {
    findUserByUsername,
    findUserById,
    findUserByEmail,
    updateLastLogin,
    createPasswordResetOTP,
    findPasswordResetOTP,
    invalidatePasswordResetOTPs,
    incrementPasswordResetOTPAttempts,
    updatePassword,
    markPasswordResetOTPUsed
};
