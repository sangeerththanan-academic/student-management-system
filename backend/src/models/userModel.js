const pool = require("../config/db");

const findUserByUsername = async (identifier) => {
    if (!identifier) return null;
    const cleanId = identifier.trim().toLowerCase();

    // 1. Check direct match on users.username
    const [rows] = await pool.execute(
        "SELECT user_id, username, password_hash, role FROM users WHERE LOWER(username) = ? LIMIT 1",
        [cleanId]
    );

    if (rows.length > 0) {
        return rows[0];
    }

    // 2. Check match on students.email
    const [studentRows] = await pool.execute(
        `SELECT u.user_id, u.username, u.password_hash, u.role
         FROM users u
         INNER JOIN students s ON u.user_id = s.user_id
         WHERE LOWER(s.email) = ?
         LIMIT 1`,
        [cleanId]
    );

    if (studentRows.length > 0) {
        return studentRows[0];
    }

    // 3. Check match on configured admin email
    const envAdminEmail = (process.env.SMTP_USER || process.env.EMAIL_USER || "").toLowerCase();
    if (envAdminEmail && cleanId === envAdminEmail) {
        const [adminRows] = await pool.execute(
            "SELECT user_id, username, password_hash, role FROM users WHERE role = 'ADMIN' LIMIT 1"
        );
        if (adminRows.length > 0) {
            return adminRows[0];
        }
    }

    return null;
};

const findUserById = async (userId) => {
    const [rows] = await pool.execute(
        "SELECT user_id, username, role FROM users WHERE user_id = ? LIMIT 1",
        [userId]
    );

    return rows[0];
};


// CR033: Update last_login timestamp after successful authentication
const updateLastLogin = async (userId) => {
    await pool.execute(
        "UPDATE users SET last_login = NOW() WHERE user_id = ?",
        [userId]
    );
};

// CR-026: Find user by email address (checking students table and username)
const findUserByEmail = async (email) => {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();

    // Check students table for matching email
    const [studentRows] = await pool.execute(
        `SELECT u.user_id, u.username, u.password_hash, u.role, s.email, s.first_name, s.last_name
         FROM users u
         INNER JOIN students s ON u.user_id = s.user_id
         WHERE LOWER(s.email) = ?
         LIMIT 1`,
        [cleanEmail]
    );

    if (studentRows.length > 0) {
        return studentRows[0];
    }

    // Check if email matches the configured admin email in .env
    const envAdminEmail = (process.env.SMTP_USER || process.env.EMAIL_USER || "").toLowerCase();
    if (envAdminEmail && cleanEmail === envAdminEmail) {
        const [adminRows] = await pool.execute(
            `SELECT user_id, username, password_hash, role, ? as email, username as first_name, '' as last_name
             FROM users
             WHERE role = 'ADMIN'
             LIMIT 1`,
            [cleanEmail]
        );
        if (adminRows.length > 0) {
            return adminRows[0];
        }
    }

    // Check if admin user entered their username
    const [userRows] = await pool.execute(
        `SELECT user_id, username, password_hash, role, NULL as email, username as first_name, '' as last_name
         FROM users
         WHERE LOWER(username) = ?
         LIMIT 1`,
        [cleanEmail]
    );

    return userRows[0] || null;
};

// CR-026: Update user password hash
const updateUserPassword = async (userId, passwordHash) => {
    await pool.execute(
        "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?",
        [passwordHash, userId]
    );
};

module.exports = {
    findUserByUsername,
    findUserById,
    updateLastLogin,
    findUserByEmail,
    updateUserPassword
};

