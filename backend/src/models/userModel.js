
const pool = require("../config/db");

// Find user by username for login.
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
        [username]
    );

    return rows[0] || null;
};

// Find user by ID for the current-user endpoint.
const findUserById = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT
            user_id,
            username,
            role
         FROM users
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0] || null;
};

module.exports = {
    findUserByUsername,
    findUserById
};
