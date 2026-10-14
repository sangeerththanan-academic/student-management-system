
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { sendOtpEmail } = require("../utils/emailService");

const OTP_EXPIRY_MINUTES = Number(
    process.env.OTP_EXPIRY_MINUTES || 10
);

const MAX_OTP_ATTEMPTS = 5;


// ==========================================
// FORGOT PASSWORD - SEND OTP
// ==========================================

const forgotPassword = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email address is required"
            });
        }

        // Email is stored in the students table.
        const [users] = await pool.execute(
            `SELECT u.user_id, s.email
             FROM users u
             INNER JOIN students s ON s.user_id = u.user_id
             WHERE LOWER(s.email) = ?
               AND u.role = 'STUDENT'
             LIMIT 1`,
            [email]
        );

        // Do not reveal whether the email exists.
        const genericMessage =
            "If an account exists for this email address, an OTP will be sent.";

        if (users.length === 0) {
            return res.status(200).json({
                success: true,
                message: genericMessage
            });
        }

        const user = users[0];

        // Generate a six-digit OTP.
        const otp = crypto
            .randomInt(0, 1000000)
            .toString()
            .padStart(6, "0");

        // Store only the OTP hash, never the plain OTP.
        const otpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        const expiresAt = new Date(
            Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
        );

        // Invalidate previous unused OTPs for this user.
        await pool.execute(
            `UPDATE password_reset_otps
             SET used_at = NOW()
             WHERE user_id = ?
               AND used_at IS NULL`,
            [user.user_id]
        );

        await pool.execute(
            `INSERT INTO password_reset_otps
                (user_id, otp_hash, expires_at, attempts)
             VALUES (?, ?, ?, 0)`,
            [user.user_id, otpHash, expiresAt]
        );

        try {
            await sendOtpEmail(email, otp);
        } catch (emailError) {
            // Invalidate the OTP if email delivery fails.
            await pool.execute(
                `UPDATE password_reset_otps
                 SET used_at = NOW()
                 WHERE user_id = ?
                   AND otp_hash = ?
                   AND used_at IS NULL`,
                [user.user_id, otpHash]
            );

            console.error(
                "Password reset email delivery failed:",
                emailError.code || emailError.message
            );

            return res.status(503).json({
                success: false,
                message:
                    "Unable to send the password reset email. " +
                    "Please check the backend SMTP settings and try again."
            });
        }

        return res.status(200).json({
            success: true,
            message: genericMessage
        });

    } catch (error) {
        console.error("Forgot password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to process the request right now"
        });
    }
};


// ==========================================
// RESET PASSWORD - VERIFY OTP AND UPDATE
// ==========================================

const resetPassword = async (req, res) => {
    const { email, otp, password, confirmPassword } = req.body;

    if (!email || !otp || !password || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "Email, OTP, password and confirmation are required"
        });
    }

    if (!/^\d{6}$/.test(String(otp))) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid six-digit OTP"
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "Passwords do not match"
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters long"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpHash = crypto
        .createHash("sha256")
        .update(String(otp))
        .digest("hex");

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [users] = await connection.execute(
            `SELECT u.user_id
             FROM users u
             INNER JOIN students s ON s.user_id = u.user_id
             WHERE LOWER(s.email) = ?
               AND u.role = 'STUDENT'
             LIMIT 1`,
            [normalizedEmail]
        );

        if (users.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        const userId = users[0].user_id;

        // Lock the latest unused OTP while verifying it.
        const [otpRows] = await connection.execute(
            `SELECT id, otp_hash, expires_at, attempts
             FROM password_reset_otps
             WHERE user_id = ?
               AND used_at IS NULL
             ORDER BY id DESC
             LIMIT 1
             FOR UPDATE`,
            [userId]
        );

        if (otpRows.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        const resetRecord = otpRows[0];

        if (
            resetRecord.attempts >= MAX_OTP_ATTEMPTS ||
            new Date(resetRecord.expires_at) <= new Date()
        ) {
            await connection.execute(
                `UPDATE password_reset_otps
                 SET used_at = NOW()
                 WHERE id = ?`,
                [resetRecord.id]
            );

            await connection.commit();

            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP. Request a new OTP."
            });
        }

        if (resetRecord.otp_hash !== otpHash) {
            await connection.execute(
                `UPDATE password_reset_otps
                 SET attempts = attempts + 1
                 WHERE id = ?`,
                [resetRecord.id]
            );

            await connection.commit();

            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // Hash the new password before saving.
        const passwordHash = await bcrypt.hash(password, 12);

        const [updateResult] = await connection.execute(
            `UPDATE users
             SET password_hash = ?
             WHERE user_id = ?
               AND role = 'STUDENT'`,
            [passwordHash, userId]
        );

        if (updateResult.affectedRows !== 1) {
            throw new Error("Password update failed");
        }

        // Make the OTP unusable after a successful reset.
        await connection.execute(
            `UPDATE password_reset_otps
             SET used_at = NOW(),
                 verified_at = NOW()
             WHERE id = ?`,
            [resetRecord.id]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Password reset successful. You can now log in."
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Reset password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to reset the password right now"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


module.exports = {
    forgotPassword,
    resetPassword
};
