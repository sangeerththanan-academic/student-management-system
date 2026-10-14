const pool = require("../config/db");

// Find user by username
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

// Find user by ID including the password hash for secure password verification.
// Never send this record directly to the client.
const findUserByIdWithPasswordHash = async (userId) => {
    const [rows] = await pool.execute(
        "SELECT user_id, username, password_hash, role FROM users WHERE user_id = ? LIMIT 1",
        [userId]
    );

    return rows[0];
};

// Update a user's password hash. The caller must hash the password first.
const updatePasswordHash = async (userId, passwordHash) => {
    const [result] = await pool.execute(
        "UPDATE users SET password_hash = ? WHERE user_id = ?",
        [passwordHash, userId]
    );

    return result;
};

// Find user by ID
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

// CR033: Update last login after successful authentication
const updateLastLogin = async (userId) => {
    const [result] = await pool.execute(
        "UPDATE users SET last_login = NOW() WHERE user_id = ?",
        [userId]
    );

    return result;
};

module.exports = {
    findUserByUsername,
    findUserById,
    findUserByIdWithPasswordHash,
    updatePasswordHash,
    updateLastLogin
};

