const pool = require("../config/db");

// FIND USER BY USERNAME
const findUserByUsername = async (username) => {
    const [rows] = await pool.execute(
        `SELECT
            user_id,
            username,
            password_hash,
            role,
            last_login
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
        [userId]
    );

    return rows[0];
};

// UPDATE LAST LOGIN
const updateLastLogin = async (userId) => {
    const [result] = await pool.execute(
        `UPDATE users
         SET last_login = NOW()
         WHERE user_id = ?`,
        [userId]
    );

    return result;
};

// EXPORT FUNCTIONS
module.exports = {
    findUserByUsername,
    findUserById,
    updateLastLogin
};
