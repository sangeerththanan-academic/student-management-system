const pool = require("../config/db");

const findUserByUsername = async (username) => {
    const [rows] = await pool.execute(
        "SELECT user_id, username, password_hash, role FROM users WHERE username = ? LIMIT 1",
        [username]
    );

    return rows[0];
};

const findUserByEmail = async (email) => {
    const [rows] = await pool.execute(
        `SELECT users.user_id, users.username, students.email
         FROM users
         INNER JOIN students ON students.user_id = users.user_id
         WHERE students.email = ?
         LIMIT 1`,
        [email]
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

const updateLastLogin = async (userId) => {
    await pool.execute(
        "UPDATE users SET last_login = NOW() WHERE user_id = ?",
        [userId]
    );
};

const updatePasswordByUserId = async (userId, passwordHash) => {
    await pool.execute(
        "UPDATE users SET password_hash = ? WHERE user_id = ?",
        [passwordHash, userId]
    );
};

const createPasswordResetRequest = async (
    userId,
    otpHash,
    expiresAt
) => {
    await pool.execute(
        `INSERT INTO password_reset_tokens
            (user_id, otp_hash, expires_at)
         VALUES (?, ?, ?)`
        ,
        [userId, otpHash, expiresAt]
    );
};

const findLatestPasswordResetRequest = async (userId, now) => {
    const [rows] = await pool.execute(
        `SELECT reset_id, user_id, otp_hash, expires_at, attempts
         FROM password_reset_tokens
         WHERE user_id = ? AND used_at IS NULL AND verified_at IS NULL
           AND expires_at > ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId, now]
    );

    return rows[0];
};

const incrementPasswordResetAttempts = async (resetId) => {
    await pool.execute(
        "UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE reset_id = ?",
        [resetId]
    );
};

const verifyPasswordResetOtp = async (
    resetId,
    resetTokenHash,
    resetTokenExpiresAt
) => {
    await pool.execute(
        `UPDATE password_reset_tokens
         SET verified_at = NOW(),
             reset_token_hash = ?,
             reset_token_expires_at = ?
         WHERE reset_id = ? AND used_at IS NULL`,
        [resetTokenHash, resetTokenExpiresAt, resetId]
    );
};

const findValidPasswordResetToken = async (resetTokenHash, now) => {
    const [rows] = await pool.execute(
        `SELECT reset_id, user_id
         FROM password_reset_tokens
         WHERE reset_token_hash = ?
           AND verified_at IS NOT NULL
           AND used_at IS NULL
           AND reset_token_expires_at > ?
         LIMIT 1`,
        [resetTokenHash, now]
    );

    return rows[0];
};

const markPasswordResetTokenUsed = async (resetId) => {
    await pool.execute(
        "UPDATE password_reset_tokens SET used_at = NOW() WHERE reset_id = ? AND used_at IS NULL",
        [resetId]
    );
};

module.exports = {
    findUserByUsername,
    findUserByEmail,
    findUserById,
    updateLastLogin,
    updatePasswordByUserId,
    createPasswordResetRequest,
    findLatestPasswordResetRequest,
    incrementPasswordResetAttempts,
    verifyPasswordResetOtp,
    findValidPasswordResetToken,
    markPasswordResetTokenUsed
};
