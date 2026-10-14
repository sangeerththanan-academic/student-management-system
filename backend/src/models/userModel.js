
const pool = require("../config/db");

// ==========================================
// FIND USER BY USERNAME
// ==========================================

const findUserByUsername = async (username) => {
    const [rows] = await pool.execute(
        `SELECT user_id, username, password_hash, role
         FROM users
         WHERE username = ?
         LIMIT 1`,
        [username]
    );

    return rows[0];
};


// ==========================================
// FIND USER BY ID
// ==========================================

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


// ==========================================
// FIND USER BY EMAIL
// ==========================================

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


// ==========================================
// EXISTING RESET TOKEN FUNCTIONS
// Keep these for compatibility with the
// existing controller until it is updated.
// ==========================================

const createPasswordResetToken = async (
    userId,
    tokenHash,
    expiresAt
) => {
    await pool.execute(
        `INSERT INTO password_reset_tokens
         (user_id, token_hash, expires_at)
         VALUES (?, ?, ?)`,
        [userId, tokenHash, expiresAt]
    );
};


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


const markPasswordResetTokenUsed = async (tokenId) => {
    await pool.execute(
        `UPDATE password_reset_tokens
         SET used_at = NOW()
         WHERE id = ?
           AND used_at IS NULL`,
        [tokenId]
    );
};


const deleteUnusedResetTokens = async (userId) => {
    await pool.execute(
        `DELETE FROM password_reset_tokens
         WHERE user_id = ?
           AND used_at IS NULL`,
        [userId]
    );
};


// ==========================================
// UPDATE USER PASSWORD
// ==========================================

const updatePassword = async (userId, passwordHash) => {
    await pool.execute(
        `UPDATE users
         SET password_hash = ?
         WHERE user_id = ?`,
        [passwordHash, userId]
    );
};


// ==========================================
// OTP FUNCTIONS
// Requires password_reset_otps table.
// ==========================================

// Delete previous OTPs for this user.
const deletePreviousOtps = async (userId) => {
    await pool.execute(
        `DELETE FROM password_reset_otps
         WHERE user_id = ?`,
        [userId]
    );
};


// Create a new OTP record.
// Store only the OTP hash, never the plain OTP.
const createPasswordResetOtp = async (
    userId,
    otpHash,
    expiresAt
) => {
    const [result] = await pool.execute(
        `INSERT INTO password_reset_otps
         (user_id, otp_hash, expires_at, attempts, used_at)
         VALUES (?, ?, ?, 0, NULL)`,
        [userId, otpHash, expiresAt]
    );

    return result.insertId;
};


// Find the latest unused OTP for a user.
const findLatestPasswordResetOtp = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT id, user_id, otp_hash, expires_at,
                attempts, used_at, created_at
         FROM password_reset_otps
         WHERE user_id = ?
           AND used_at IS NULL
         ORDER BY created_at DESC, id DESC
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};


// Increase the failed OTP attempt count.
const incrementOtpAttempts = async (otpId) => {
    await pool.execute(
        `UPDATE password_reset_otps
         SET attempts = attempts + 1
         WHERE id = ?
           AND used_at IS NULL`,
        [otpId]
    );
};


// Mark an OTP as used only if it is still active.
const markOtpUsed = async (otpId) => {
    const [result] = await pool.execute(
        `UPDATE password_reset_otps
         SET used_at = NOW()
         WHERE id = ?
           AND used_at IS NULL
           AND expires_at > NOW()
           AND attempts < 5`,
        [otpId]
    );

    return result.affectedRows === 1;
};


// ==========================================
// EXPORT FUNCTIONS
// ==========================================

module.exports = {
    // Existing authentication functions
    findUserByUsername,
    findUserById,
    findUserByEmail,

    // Existing token functions
    createPasswordResetToken,
    findPasswordResetToken,
    markPasswordResetTokenUsed,
    deleteUnusedResetTokens,

    // Password update
    updatePassword,

    // New OTP functions
    deletePreviousOtps,
    createPasswordResetOtp,
    findLatestPasswordResetOtp,
    incrementOtpAttempts,
    markOtpUsed
};
