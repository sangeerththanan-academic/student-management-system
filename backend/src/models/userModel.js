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
        `SELECT user_id, username, email, role, last_login
         FROM users
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// Update last login
const updateLastLogin = async (userId) => {
    const [result] = await pool.execute(
        `UPDATE users
         SET last_login = NOW()
         WHERE user_id = ?`,
        [userId]
    );

    return result;
};

// Find user by registered email
const findUserByEmail = async (email) => {
    const [rows] = await pool.execute(
        `SELECT user_id, username, email, password_hash, role
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [email]
    );

    return rows[0];
};

// Delete previous OTPs for a user
const deletePasswordResetOtps = async (userId) => {
    const [result] = await pool.execute(
        `DELETE FROM password_reset_otps
         WHERE user_id = ?`,
        [userId]
    );

    return result;
};

// Create a new OTP record
const createPasswordResetOtp = async (
    userId,
    otpHash,
    expiresAt
) => {
    const [result] = await pool.execute(
        `INSERT INTO password_reset_otps
            (user_id, otp_hash, expires_at, attempts)
         VALUES (?, ?, ?, 0)`,
        [userId, otpHash, expiresAt]
    );

    return result;
};

// Find the latest OTP
const findPasswordResetOtp = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT id, user_id, otp_hash, expires_at,
                attempts, verified_at, used_at
         FROM password_reset_otps
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// Count incorrect OTP attempts
const incrementPasswordResetOtpAttempts = async (otpId) => {
    const [result] = await pool.execute(
        `UPDATE password_reset_otps
         SET attempts = attempts + 1
         WHERE id = ?`,
        [otpId]
    );

    return result;
};

// Mark OTP as verified
const markPasswordResetOtpVerified = async (otpId) => {
    const [result] = await pool.execute(
        `UPDATE password_reset_otps
         SET verified_at = NOW()
         WHERE id = ?
         AND verified_at IS NULL
         AND used_at IS NULL`,
        [otpId]
    );

    return result;
};

// Create reset token after successful OTP verification
const createPasswordResetToken = async (
    userId,
    tokenHash,
    expiresAt
) => {
    const [result] = await pool.execute(
        `INSERT INTO password_reset_tokens
            (user_id, token_hash, expires_at)
         VALUES (?, ?, ?)`,
        [userId, tokenHash, expiresAt]
    );

    return result;
};

// Find reset token
const findPasswordResetToken = async (tokenHash) => {
    const [rows] = await pool.execute(
        `SELECT id, user_id, token_hash, expires_at, used_at
         FROM password_reset_tokens
         WHERE token_hash = ?
         LIMIT 1`,
        [tokenHash]
    );

    return rows[0];
};

// Mark reset token as used
const markPasswordResetTokenUsed = async (tokenId) => {
    const [result] = await pool.execute(
        `UPDATE password_reset_tokens
         SET used_at = NOW()
         WHERE id = ?
         AND used_at IS NULL`,
        [tokenId]
    );

    return result;
};

// Update user's password
const updatePassword = async (userId, passwordHash) => {
    const [result] = await pool.execute(
        `UPDATE users
         SET password_hash = ?
         WHERE user_id = ?`,
        [passwordHash, userId]
    );

    return result;
};

// Delete unused reset tokens
const deleteUnusedResetTokens = async (userId) => {
    const [result] = await pool.execute(
        `DELETE FROM password_reset_tokens
         WHERE user_id = ?
         AND used_at IS NULL`,
        [userId]
    );

    return result;
};

module.exports = {
    findUserByUsername,
    findUserById,
    updateLastLogin,
    findUserByEmail,
    createPasswordResetOtp,
    findPasswordResetOtp,
    incrementPasswordResetOtpAttempts,
    markPasswordResetOtpVerified,
    deletePasswordResetOtps,
    createPasswordResetToken,
    findPasswordResetToken,
    markPasswordResetTokenUsed,
    updatePassword,
    deleteUnusedResetTokens
};