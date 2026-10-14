const pool = require("../config/db");

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
         WHERE id = ?`,
        [tokenId]
    );
};

const updatePassword = async (userId, passwordHash) => {
    await pool.execute(
        `UPDATE users
         SET password_hash = ?
         WHERE user_id = ?`,
        [passwordHash, userId]
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

module.exports = {
    findUserByUsername,
    findUserById,
    findUserByEmail,
    createPasswordResetToken,
    findPasswordResetToken,
    markPasswordResetTokenUsed,
    updatePassword,
    deleteUnusedResetTokens
};
