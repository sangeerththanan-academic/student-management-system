const pool = require("../config/db");

// ==========================================
// FIND USER BY USERNAME
// ==========================================

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
// CR-033: UPDATE LAST LOGIN
// ==========================================

const updateLastLogin = async (userId) => {
    const [result] = await pool.execute(
        `UPDATE users
         SET last_login = NOW()
         WHERE user_id = ?`,
        [userId]
    );

    return result;
};

// ==========================================
// CR-020: GET STUDENT PASSWORD HASH
// ==========================================

const getPasswordHashByUserId = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT password_hash
         FROM users
         WHERE user_id = ?
           AND role = 'STUDENT'
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// ==========================================
// CR-020: UPDATE STUDENT PASSWORD HASH
// ==========================================

const updatePasswordHash = async (userId, passwordHash) => {
    const [result] = await pool.execute(
        `UPDATE users
         SET password_hash = ?
         WHERE user_id = ?
           AND role = 'STUDENT'`,
        [passwordHash, userId]
    );

    return result;
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
// CREATE PASSWORD RESET TOKEN
// ==========================================

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

// ==========================================
// FIND PASSWORD RESET TOKEN
// ==========================================

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

// ==========================================
// MARK RESET TOKEN AS USED
// ==========================================

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

// ==========================================
// UPDATE PASSWORD
// ==========================================

const updatePassword = async (userId, passwordHash) => {
    const [result] = await pool.execute(
        `UPDATE users
         SET password_hash = ?
         WHERE user_id = ?`,
        [passwordHash, userId]
    );

    return result;
};

// ==========================================
// DELETE UNUSED RESET TOKENS
// ==========================================

const deleteUnusedResetTokens = async (userId) => {
    const [result] = await pool.execute(
        `DELETE FROM password_reset_tokens
         WHERE user_id = ?
           AND used_at IS NULL`,
        [userId]
    );

    return result;
};

// ==========================================
// DELETE PASSWORD RESET OTPS
// ==========================================

const deletePasswordResetOtps = async (userId) => {
    const [result] = await pool.execute(
        `DELETE FROM password_reset_otps
         WHERE user_id = ?`,
        [userId]
    );

    return result;
};

// ==========================================
// CREATE PASSWORD RESET OTP
// ==========================================

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

// ==========================================
// FIND LATEST PASSWORD RESET OTP
// ==========================================

const findLatestPasswordResetOtp = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT id, user_id, otp_hash, expires_at,
                attempts, verified_at
         FROM password_reset_otps
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// ==========================================
// INCREMENT INCORRECT OTP ATTEMPTS
// ==========================================

const incrementPasswordResetOtpAttempts = async (otpId) => {
    const [result] = await pool.execute(
        `UPDATE password_reset_otps
         SET attempts = attempts + 1
         WHERE id = ?
           AND verified_at IS NULL
           AND attempts < 5`,
        [otpId]
    );

    return result;
};

// ==========================================
// MARK OTP AS VERIFIED
// ==========================================

const markPasswordResetOtpVerified = async (otpId) => {
    const [result] = await pool.execute(
        `UPDATE password_reset_otps
         SET verified_at = NOW()
         WHERE id = ?
           AND verified_at IS NULL
           AND attempts < 5`,
        [otpId]
    );

    return result;
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    findUserByUsername,
    findUserById,
    updateLastLogin,
    getPasswordHashByUserId,
    updatePasswordHash,
    findUserByEmail,
    createPasswordResetToken,
    findPasswordResetToken,
    markPasswordResetTokenUsed,
    updatePassword,
    deleteUnusedResetTokens,
    deletePasswordResetOtps,
    createPasswordResetOtp,
    findLatestPasswordResetOtp,
    incrementPasswordResetOtpAttempts,
    markPasswordResetOtpVerified
};