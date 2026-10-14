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
        `SELECT u.user_id, u.username, COALESCE(u.email, s.email) AS email, u.password_hash, u.role
         FROM users u
         LEFT JOIN students s ON s.user_id = u.user_id
         WHERE LOWER(u.email) = LOWER(?) OR LOWER(s.email) = LOWER(?)
         LIMIT 1`,
        [email, email]
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
         (user_id, token_hash, attempts, expires_at)
         VALUES (?, ?, 0, ?)`,
        [userId, tokenHash, expiresAt]
    );
};

const findLatestResetTokenForUser = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT id, user_id, token_hash, attempts, expires_at, used_at
         FROM password_reset_tokens
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};

const findPasswordResetToken = async (tokenHash) => {
    const [rows] = await pool.execute(
        `SELECT id, user_id, token_hash, attempts, expires_at, used_at
         FROM password_reset_tokens
         WHERE token_hash = ?
         ORDER BY id DESC
         LIMIT 1`,
        [tokenHash]
    );

    return rows[0];
};

const incrementTokenAttempts = async (tokenId) => {
    await pool.execute(
        `UPDATE password_reset_tokens
         SET attempts = attempts + 1
         WHERE id = ?`,
        [tokenId]
    );
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
    findLatestResetTokenForUser,
    findPasswordResetToken,
    incrementTokenAttempts,
    markPasswordResetTokenUsed,
    updatePassword,
    deleteUnusedResetTokens
};
