const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const pool = require("../config/db");
require("dotenv").config()
const {
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
} = require("../models/authModel");

const {
    findUserByUsername,
    findUserById,
    findUserByIdWithPassword,
    updatePasswordHash
} = require("../models/userModel");
const {
    shouldTrackStudentLogin
} = require("../utils/loginTracking");

const requestStudentPasswordReset = async (req, res) => {
    try {
        const email = typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid email address"
            });
        }

        await ensurePasswordResetTable();

        const student = await findStudentByEmail(email);

        if (!student) {
            return res.status(200).json({
                success: true,
                message: "If this email belongs to a student account, an OTP will be sent."
            });
        }

        if (await hasRecentPasswordResetRequest(student.email)) {
            return res.status(429).json({
                success: false,
                message: "Please wait one minute before requesting another OTP"
            });
        }

        const otp = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await savePasswordResetOtp(student.email, student.user_id, otpHash, expiresAt);

        const port = Number(process.env.SMTP_PORT || 587);
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_SERVER?.trim(),
            port,
            secure: port === 465,
            auth: {
                user: process.env.SMTP_EMAIL?.trim(),
                pass: process.env.SMTP_PASSWORD?.replace(/\s/g, "")
            }
        });

        await transporter.sendMail({
            from: process.env.SMTP_EMAIL?.trim(),
            to: student.email,
            subject: "Student account password reset OTP",
            text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your password reset OTP is <strong>${otp}</strong>.</p><p>It expires in 10 minutes. If you did not request this, ignore this email.</p>`
        });

        return res.status(200).json({
            success: true,
            message: "If this email belongs to a student account, an OTP will be sent."
        });
    } catch (error) {
        console.error("Student password reset request error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to send a reset OTP right now"
        });
    }
};

const verifyStudentPasswordResetOtp = async (req, res) => {
    try {
        const email = typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";
        const otp = typeof req.body.otp === "string" ? req.body.otp.trim() : "";

        if (!email || !/^\d{6}$/.test(otp || "")) {
            return res.status(400).json({
                success: false,
                message: "Enter the email and six-digit OTP"
            });
        }

        await ensurePasswordResetTable();

        const challenge = await findPasswordResetOtp(email);

        if (!challenge || new Date(challenge.expires_at) <= new Date() || challenge.attempts >= 5) {
            return res.status(400).json({
                success: false,
                message: "OTP is invalid or expired. Request a new one."
            });
        }

        const matches = await bcrypt.compare(otp, challenge.otp_hash);
        if (!matches) {
            await incrementPasswordResetAttempts(email);
            return res.status(400).json({
                success: false,
                message: "OTP is invalid or expired. Request a new one."
            });
        }

        await markPasswordResetVerified(email);

        const resetToken = jwt.sign(
            { userId: challenge.user_id, email, purpose: "student_password_reset" },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );

        return res.status(200).json({
            success: true,
            resetToken,
            message: "OTP verified"
        });
    } catch (error) {
        console.error("Student password reset OTP verification error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to verify the OTP right now"
        });
    }
};

const resetStudentPassword = async (req, res) => {
    let connection;

    try {
        const { resetToken, newPassword, confirmPassword } = req.body;

        if (
            typeof resetToken !== "string" ||
            typeof newPassword !== "string" ||
            typeof confirmPassword !== "string" ||
            !resetToken ||
            !newPassword ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required"
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New passwords do not match"
            });
        }

        const claims = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (claims.purpose !== "student_password_reset" || !claims.userId || !claims.email) {
            return res.status(400).json({
                success: false,
                message: "Password reset session is invalid or expired"
            });
        }

        await ensurePasswordResetTable();
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const challenge = await findVerifiedPasswordReset(connection, claims.email, claims.userId);

        if (!challenge) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: "Password reset session is invalid or expired"
            });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        const updatedRows = await updateStudentPassword(
            connection,
            claims.userId,
            claims.email,
            passwordHash
        );
        if (updatedRows !== 1) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: "Password reset session is invalid or expired"
            });
        }

        await deletePasswordResetOtp(connection, claims.email);
        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(400).json({
                success: false,
                message: "Password reset session is invalid or expired"
            });
        }

        console.error("Student password reset error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to reset the password right now"
        });
    } finally {
        connection?.release();
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        // Find user
        const user = await findUserByUsername(username);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        if (shouldTrackStudentLogin(user)) {
            await pool.execute(
                "UPDATE users SET last_login_at = NOW() WHERE user_id = ?",
                [user.user_id]
            );
        }

        // Create JWT
        const token = jwt.sign(
            {
                userId: user.user_id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.user_id,
                username: user.username,
                role: user.role,
                lastLoginAt: shouldTrackStudentLogin(user) ? new Date().toISOString() : null
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await findUserById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Get current user error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New passwords do not match"
            });
        }

        const user = await findUserByIdWithPassword(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const oldPasswordMatch = await bcrypt.compare(
            oldPassword,
            user.password_hash
        );

        if (!oldPasswordMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await updatePasswordHash(user.user_id, passwordHash);

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    login,
    getCurrentUser,
    changePassword,
    requestStudentPasswordReset,
    verifyStudentPasswordResetOtp,
    resetStudentPassword
};
