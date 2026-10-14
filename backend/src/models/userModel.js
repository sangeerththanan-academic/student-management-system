const pool = require("../config/db");

// Find a user by username for login.
// Student email comes from the students table.
const findUserByUsername = async (username) => {
    const [rows] = await pool.execute(
        `SELECT
            u.user_id,
            u.username,
            u.password_hash,
            u.role,
            s.email
         FROM users u
         LEFT JOIN students s ON s.user_id = u.user_id
         WHERE u.username = ?
         LIMIT 1`,
        [username]
    );

    return rows[0] || null;
};

// Find a user by ID for the current-user endpoint.
const findUserById = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT
            u.user_id,
            u.username,
            u.role,
            s.email
         FROM users u
         LEFT JOIN students s ON s.user_id = u.user_id
         WHERE u.user_id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0] || null;
};

// Find a Student account using the registered email.
const findUserByEmail = async (email) => {
    const [rows] = await pool.execute(
        `SELECT
            u.user_id,
            u.username,
            u.password_hash,
            u.role,
            s.email
         FROM users u
         INNER JOIN students s ON s.user_id = u.user_id
         WHERE LOWER(TRIM(s.email)) = LOWER(TRIM(?))
           AND u.role = 'STUDENT'
         LIMIT 1`,
        [email]
    );

    return rows[0] || null;
};

// Create a password reset token.
const createPasswordResetToken = async (
    userId,
    tokenHash,
    expiresAt
) => {
    await pool.execute(
        `INSERT INTO password_reset_tokens
            (user_id, token_hash, expires_at)
         VALUES (?, ?, ?)`,
        [userId, tokenHash, expiresAt]
    );
};

// Find a password reset token by its hash.
const findPasswordResetToken = async (tokenHash) => {
    const [rows] = await pool.execute(
        `SELECT
            id,
            user_id,
            token_hash,
            expires_at,
            used_at
         FROM password_reset_tokens
         WHERE token_hash = ?
         LIMIT 1`,
        [tokenHash]
    );

    return rows[0] || null;
};

// Mark a password reset token as used.
const markPasswordResetTokenUsed = async (tokenId) => {
    await pool.execute(
        `UPDATE password_reset_tokens
         SET used_at = NOW()
         WHERE id = ?`,
        [tokenId]
    );
};

// Update a user's password hash.
const updatePassword = async (userId, passwordHash) => {
    await pool.execute(
        `UPDATE users
         SET password_hash = ?
         WHERE user_id = ?`,
        [passwordHash, userId]
    );
};

// Delete previous unused reset tokens for a user.
const deleteUnusedResetTokens = async (userId) => {
    await pool.execute(
        `DELETE FROM password_reset_tokens
         WHERE user_id = ?
           AND used_at IS NULL`,
        [userId]
    );
};

// Create a Student login OTP.
const createStudentLoginOtp = async (
    userId,
    otpHash,
    expiresAt
) => {
    await pool.execute(
        `INSERT INTO student_login_otps
            (user_id, otp_hash, expires_at)
         VALUES (?, ?, ?)`,
        [userId, otpHash, expiresAt]
    );
};

// Delete previous OTPs for a Student.
const deleteStudentLoginOtps = async (userId) => {
    await pool.execute(
        `DELETE FROM student_login_otps
         WHERE user_id = ?`,
        [userId]
    );
};

// Get the latest Student login OTP.
const getLatestStudentLoginOtp = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT
            id,
            user_id,
            otp_hash,
            expires_at,
            attempts,
            (expires_at > NOW()) AS is_valid
         FROM student_login_otps
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [userId]
    );

    if (!rows[0]) {
        return null;
    }

    return {
        ...rows[0],
        is_valid: Boolean(rows[0].is_valid)
    };
};

// Count failed OTP verification attempts.
const incrementStudentLoginOtpAttempts = async (otpId) => {
    await pool.execute(
        `UPDATE student_login_otps
         SET attempts = attempts + 1
         WHERE id = ?`,
        [otpId]
    );
};

// Delete a successfully verified OTP.
const deleteStudentLoginOtpById = async (otpId) => {
    await pool.execute(
        `DELETE FROM student_login_otps
         WHERE id = ?`,
        [otpId]
    );
};

module.exports = {
    findUserByUsername,
    findUserById,
    findUserByEmail,

    createPasswordResetToken,
    findPasswordResetToken,
    markPasswordResetTokenUsed,
    updatePassword,
    deleteUnusedResetTokens,

    createStudentLoginOtp,
    deleteStudentLoginOtps,
    getLatestStudentLoginOtp,
    incrementStudentLoginOtpAttempts,
    deleteStudentLoginOtpById
};