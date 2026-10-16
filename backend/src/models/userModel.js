
const pool = require("../config/db");

// Find user by username
const findUserByUsername = async (username) => {
    const [rows] = await pool.execute(
        "SELECT user_id, username, password_hash, role FROM users WHERE username = ? LIMIT 1",
        [username]
    );

    return rows[0];
};

// Find user by ID
const findUserById = async (userId) => {
    const [rows] = await pool.execute(
        "SELECT user_id, username, role FROM users WHERE user_id = ? LIMIT 1",
        [userId]
    );

    return rows[0];
};

// Return only the password hash needed to verify a password change.
const findUserPasswordHashById = async (userId) => {
    const [rows] = await pool.execute(
        "SELECT user_id, password_hash FROM users WHERE user_id = ? LIMIT 1",
        [userId]
    );
    return rows[0];
};

// Store only a bcrypt hash; never store a plain-text password.
const updateUserPasswordHash = async (userId, passwordHash) => {
    const [result] = await pool.execute(
        "UPDATE users SET password_hash = ? WHERE user_id = ?",
        [passwordHash, userId]
    );
    return result;
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
    findUserPasswordHashById,
    updateUserPasswordHash,
    updateLastLogin
};
