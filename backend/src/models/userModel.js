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
        `SELECT user_id, username, role
         FROM users
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// CR-033: Update last login after successful student login
const updateLastLogin = async (userId) => {
    const [result] = await pool.execute(
        `UPDATE users
         SET last_login = NOW()
         WHERE user_id = ?`,
        [userId]
    );

    return result;
};

// CR-020: Get the authenticated student's password hash
const getPasswordHashByUserId = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT password_hash
         FROM users
         WHERE user_id = ?
           AND role = 'STUDENT'
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// CR-020: Update password using its bcrypt hash
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
    getPasswordHashByUserId,
    updatePasswordHash
};