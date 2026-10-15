const pool = require("../config/db");

// Find user by username (existing login)
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

// Find user by ID (existing authentication)
const findUserById = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT user_id, username, role
         FROM users
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// Update last login (preserve CR-033)
const updateLastLogin = async (userId) => {
    const [result] = await pool.execute(
        `UPDATE users
         SET last_login = NOW()
         WHERE user_id = ?`,
        [userId]
    );

    if (result.affectedRows !== 1) {
        throw new Error("Failed to update last login timestamp");
    }
};

// Find a student account using the registered student email
const findUserByEmail = async (email) => {
    const [rows] = await pool.execute(
        `SELECT u.user_id, u.username, u.role
         FROM users u
         INNER JOIN students s ON s.user_id = u.user_id
         WHERE LOWER(TRIM(s.email)) = ?
         LIMIT 1`,
        [email.trim().toLowerCase()]
    );

    return rows[0];
};

// Delete older, unused reset tokens for the same user
const deleteUnusedResetTokens = async (userId) => {
    await pool.execute(
        `DELETE FROM password_reset_tokens
         WHERE user_id = ? AND used_at IS NULL`,
        [userId]
    );
};

// Save the SHA-256 token hash and expiry
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

// Reset password and consume the token in one transaction
const resetPasswordWithToken = async (tokenHash, passwordHash) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [tokens] = await connection.execute(
            `SELECT id, user_id
             FROM password_reset_tokens
             WHERE token_hash = ?
               AND used_at IS NULL
               AND expires_at > NOW()
             LIMIT 1
             FOR UPDATE`,
            [tokenHash]
        );

        if (tokens.length === 0) {
            await connection.rollback();
            return false;
        }

        const resetToken = tokens[0];

        const [passwordResult] = await connection.execute(
            `UPDATE users
             SET password_hash = ?
             WHERE user_id = ?`,
            [passwordHash, resetToken.user_id]
        );

        if (passwordResult.affectedRows !== 1) {
            throw new Error("Failed to update password");
        }

        await connection.execute(
            `UPDATE password_reset_tokens
             SET used_at = NOW()
             WHERE id = ? AND used_at IS NULL`,
            [resetToken.id]
        );

        // Invalidate any other outstanding reset tokens for this user
        await connection.execute(
            `DELETE FROM password_reset_tokens
             WHERE user_id = ?
               AND id <> ?
               AND used_at IS NULL`,
            [resetToken.user_id, resetToken.id]
        );

        await connection.commit();
        return true;
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
    updateLastLogin,
    findUserByEmail,
    deleteUnusedResetTokens,
    createPasswordResetToken,
    resetPasswordWithToken
};
