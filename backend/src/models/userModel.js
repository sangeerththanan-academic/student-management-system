const pool = require("../config/db");

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

const findUserById = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT u.user_id, u.username, s.email, u.role
         FROM users u
         LEFT JOIN students s ON s.user_id = u.user_id
         WHERE u.user_id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};

const updateLastLogin = async (userId) => {
    const [result] = await pool.execute(
        `UPDATE users
         SET last_login = NOW()
         WHERE user_id = ?`,
        [userId]
    );

    return result;
};

// CR-020: Get user account including password hash
const findUserByIdWithPassword = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT user_id, password_hash, role
         FROM users
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// CR-020: Update password hash
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

module.exports = {
    findUserByUsername,
    findUserById,
    updateLastLogin,
    findUserByIdWithPassword,
    updatePasswordHash,
};
