const pool = require("../config/db");

const findUserByUsername = async (username) => {
    const [rows] = await pool.execute(
        "SELECT user_id, username, password_hash, role, last_login_at FROM users WHERE username = ? LIMIT 1",
        [username]
    );

    return rows[0];
};

const findUserById = async (userId) => {
    const [rows] = await pool.execute(
        "SELECT user_id, username, role, last_login_at FROM users WHERE user_id = ? LIMIT 1",
        [userId]
    );

    return rows[0];
};

const findUserByIdWithPassword = async (userId) => {
    const [rows] = await pool.execute(
        "SELECT user_id, password_hash FROM users WHERE user_id = ? LIMIT 1",
        [userId]
    );

    return rows[0];
};

const updatePasswordHash = async (userId, passwordHash) => {
    await pool.execute(
        "UPDATE users SET password_hash = ? WHERE user_id = ?",
        [passwordHash, userId]
    );
};

module.exports = {
    findUserByUsername,
    findUserById,
    findUserByIdWithPassword,
    updatePasswordHash
};
