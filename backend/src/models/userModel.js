const pool = require("../config/db");

// FIND USER BY USERNAME
const findUserByUsername = async (username) => {
    const [rows] = await pool.execute(

        `SELECT
            user_id,
            username,
            password_hash,
            role
        FROM users
        WHERE username = ?
        LIMIT 1`,

        `SELECT user_id, username, email, password_hash, role
         FROM users
         WHERE username = ?
         LIMIT 1`,

        [username]
    );

    return rows[0];
};

// FIND USER BY ID
const findUserById = async (userId) => {
    const [rows] = await pool.execute(

        `SELECT
            user_id,
            username,
            role,
            last_login
        FROM users
        WHERE user_id = ?
        LIMIT 1`,

        `SELECT user_id, username, email, role
         FROM users
         WHERE user_id = ?
         LIMIT 1`,

        [userId]
    );

    return rows[0];
};


// CR-033: UPDATE LAST SUCCESSFUL LOGIN
const updateLastLogin = async (userId) => {
    const [result] = await pool.execute(
        `UPDATE users
         SET last_login = NOW()
         WHERE user_id = ?`,
        [userId]
    );

    return result;

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

    updateLastLogin
};

    findUserByEmail,
    createPasswordResetToken,
    findPasswordResetToken,
    markPasswordResetTokenUsed,
    updatePassword,
    deleteUnusedResetTokens
};

