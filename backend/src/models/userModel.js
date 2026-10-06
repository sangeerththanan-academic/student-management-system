const pool = require("../config/db");

const findUserByUsername = async (username) => {
    const [rows] = await pool.execute(
        "SELECT user_id, username, password_hash, role FROM users WHERE username = ? LIMIT 1",
        [username]
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

module.exports = {
    findUserByUsername,
    findUserById
};
