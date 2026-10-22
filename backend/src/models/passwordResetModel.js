require("dotenv").config();
const crypto = require("crypto");
const pool = require("../config/db");

// Ensure password_resets table exists
const ensurePasswordResetsTable = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS password_resets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(255) NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            used TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_token (token),
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    try {
        await pool.execute(sql);
    } catch (err) {
        console.error("Error ensuring password_resets table:", err.message);
    }
};

// Auto-run on startup
ensurePasswordResetsTable().catch(console.error);

// Create a reset OTP (SEC-004: crypto random 6-digit OTP, SEC-005: 15 min expiry, SEC-006: invalidate previous)
const createPasswordResetToken = async (userId) => {
    await ensurePasswordResetsTable();

    // Invalidate any previous unused tokens for this user
    await pool.execute(
        "UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0",
        [userId]
    );

    // 6-digit cryptographically secure numeric OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Expiration: 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.execute(
        "INSERT INTO password_resets (user_id, token, expires_at, used) VALUES (?, ?, ?, 0)",
        [userId, otp, expiresAt]
    );

    return { token: otp, otp, expiresAt };
};

// Find valid token / OTP (FR-007, SEC-005, SEC-006)
const findValidResetToken = async (token, userId = null) => {
    if (!token) return null;
    await ensurePasswordResetsTable();

    const cleanToken = token.toString().trim();

    if (userId) {
        const [rows] = await pool.execute(
            `SELECT id, user_id, token, expires_at, used 
             FROM password_resets 
             WHERE token = ? AND user_id = ? AND used = 0 AND expires_at > NOW() 
             ORDER BY id DESC LIMIT 1`,
            [cleanToken, userId]
        );
        return rows[0] || null;
    }

    const [rows] = await pool.execute(
        `SELECT id, user_id, token, expires_at, used 
         FROM password_resets 
         WHERE token = ? AND used = 0 AND expires_at > NOW() 
         ORDER BY id DESC LIMIT 1`,
        [cleanToken]
    );

    return rows[0] || null;
};

// Check if token exists but is expired or already used
const inspectResetToken = async (token) => {
    if (!token) return null;
    await ensurePasswordResetsTable();

    const [rows] = await pool.execute(
        "SELECT id, user_id, token, expires_at, used, (expires_at <= NOW()) as is_expired FROM password_resets WHERE token = ? LIMIT 1",
        [token]
    );

    return rows[0] || null;
};

// Mark token as used upon successful password reset (SEC-006)
const markTokenAsUsed = async (tokenId) => {
    await pool.execute(
        "UPDATE password_resets SET used = 1 WHERE id = ?",
        [tokenId]
    );
};

module.exports = {
    ensurePasswordResetsTable,
    createPasswordResetToken,
    findValidResetToken,
    inspectResetToken,
    markTokenAsUsed
};
