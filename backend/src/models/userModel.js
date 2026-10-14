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

// CR-006: Update last successful login time
const updateLastLogin = async (userId) => {
    try {
        const [result] = await pool.execute(
            "UPDATE users SET last_login = NOW() WHERE user_id = ?",
            [userId]
        );

        console.log("Last login update:", {
            userId,
            affectedRows: result.affectedRows
        });

        return result;
    } catch (error) {
        console.error("Last login update error:", error);
        throw error;
    }
};

module.exports = {
    findUserByUsername,
    findUserById,
    updateLastLogin
};