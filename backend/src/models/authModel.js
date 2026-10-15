const pool = require("../config/db");

let passwordResetTablePromise;

const ensurePasswordResetTable = async () => {
    if (!passwordResetTablePromise) {
        passwordResetTablePromise = pool.execute(`
            CREATE TABLE IF NOT EXISTS student_password_reset_otps (
                email VARCHAR(150) PRIMARY KEY,
                user_id INT NOT NULL,
                otp_hash VARCHAR(255) NOT NULL,
                expires_at DATETIME NOT NULL,
                attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
                verified_at DATETIME NULL,
                requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_student_password_reset_user
                    FOREIGN KEY (user_id) REFERENCES users(user_id)
                    ON DELETE CASCADE
            )
        `).catch((error) => {
            passwordResetTablePromise = null;
            throw error;
        });
    }

    await passwordResetTablePromise;
};

const findStudentByEmail = async (email) => {
    const [rows] = await pool.execute(
        `SELECT students.email, students.user_id
         FROM students
         JOIN users ON users.user_id = students.user_id
         WHERE LOWER(students.email) = ? AND users.role = 'STUDENT'
         LIMIT 1`,
        [email]
    );

    return rows[0];
};

const hasRecentPasswordResetRequest = async (email) => {
    const [rows] = await pool.execute(
        `SELECT requested_at
         FROM student_password_reset_otps
         WHERE email = ? AND requested_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
         LIMIT 1`,
        [email]
    );

    return Boolean(rows[0]);
};

const savePasswordResetOtp = async (email, userId, otpHash, expiresAt) => {
    await pool.execute(
        `INSERT INTO student_password_reset_otps
            (email, user_id, otp_hash, expires_at, attempts, verified_at, requested_at)
         VALUES (?, ?, ?, ?, 0, NULL, NOW())
         ON DUPLICATE KEY UPDATE
            user_id = VALUES(user_id),
            otp_hash = VALUES(otp_hash),
            expires_at = VALUES(expires_at),
            attempts = 0,
            verified_at = NULL,
            requested_at = NOW()`,
        [email, userId, otpHash, expiresAt]
    );
};

const findPasswordResetOtp = async (email) => {
    const [rows] = await pool.execute(
        `SELECT email, user_id, otp_hash, expires_at, attempts
         FROM student_password_reset_otps
         WHERE email = ?
         LIMIT 1`,
        [email]
    );

    return rows[0];
};

const incrementPasswordResetAttempts = async (email) => {
    await pool.execute(
        `UPDATE student_password_reset_otps
         SET attempts = attempts + 1
         WHERE email = ?`,
        [email]
    );
};

const markPasswordResetVerified = async (email) => {
    await pool.execute(
        `UPDATE student_password_reset_otps
         SET verified_at = NOW()
         WHERE email = ?`,
        [email]
    );
};

const findVerifiedPasswordReset = async (connection, email, userId) => {
    const [rows] = await connection.execute(
        `SELECT email FROM student_password_reset_otps
         WHERE email = ? AND user_id = ?
           AND verified_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
         FOR UPDATE`,
        [email, userId]
    );

    return rows[0];
};

const updateStudentPassword = async (connection, userId, email, passwordHash) => {
    const [result] = await connection.execute(
        `UPDATE users
         JOIN students ON students.user_id = users.user_id
         SET users.password_hash = ?
         WHERE users.user_id = ? AND students.email = ? AND users.role = 'STUDENT'`,
        [passwordHash, userId, email]
    );

    return result.affectedRows;
};

const deletePasswordResetOtp = async (connection, email) => {
    await connection.execute(
        "DELETE FROM student_password_reset_otps WHERE email = ?",
        [email]
    );
};

module.exports = {
    ensurePasswordResetTable,
    findStudentByEmail,
    hasRecentPasswordResetRequest,
    savePasswordResetOtp,
    findPasswordResetOtp,
    incrementPasswordResetAttempts,
    markPasswordResetVerified,
    findVerifiedPasswordReset,
    updateStudentPassword,
    deletePasswordResetOtp
};