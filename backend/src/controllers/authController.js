
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
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
} = require("../models/userModel");

const {
    sendPasswordResetEmail,
    sendPasswordChangedEmail,
    sendStudentLoginOtpEmail
} = require("../services/emailService");

// POST /api/auth/login
// Existing username/password login: unchanged.
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required."
            });
        }

        const user = await findUserByUsername(username.trim());

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        const valid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!valid) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing from .env");
        }

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
            message: "Login successful.",
            token,
            user: {
                userId: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to log in."
        });
    }
};

// GET /api/auth/me
const getCurrentUser = async (req, res) => {
    try {
        const user = await findUserById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error("Get current user error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve user."
        });
    }
};

// POST /api/auth/student/request-login-otp
// Student only: send a 6-digit OTP to registered email.
const requestStudentLoginOtp = async (req, res) => {
    try {
        const email = typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please enter your registered email."
            });
        }

        const user = await findUserByEmail(email);

        if (
            !user ||
            String(user.role).toUpperCase() !== "STUDENT"
        ) {
            return res.status(400).json({
                success: false,
                message: "Unable to send OTP for this student account."
            });
        }

        await deleteStudentLoginOtps(user.user_id);

        const otp = crypto
            .randomInt(100000, 1000000)
            .toString();

        const otpHash = await bcrypt.hash(otp, 10);

        const expiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        await createStudentLoginOtp(
            user.user_id,
            otpHash,
            expiresAt
        );

        try {
            await sendStudentLoginOtpEmail(user.email, otp);
        } catch (emailError) {
            await deleteStudentLoginOtps(user.user_id);

            console.error(
                "Student OTP email error:",
                emailError.message
            );

            return res.status(500).json({
                success: false,
                message: "Unable to send OTP. Please try again."
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP sent to your registered email."
        });
    } catch (error) {
        console.error(
            "Request student OTP error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to process the request."
        });
    }
};

// POST /api/auth/student/verify-login-otp
// Verify OTP and log the student in directly.
const verifyStudentLoginOtp = async (req, res) => {
    try {
        const email = typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

        const otp = typeof req.body.otp === "string"
            ? req.body.otp.trim()
            : "";

        if (!email || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "Enter your email and 6-digit OTP."
            });
        }

        const user = await findUserByEmail(email);

        if (
            !user ||
            String(user.role).toUpperCase() !== "STUDENT"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP."
            });
        }

        const record = await getLatestStudentLoginOtp(
            user.user_id
        );

        if (
            !record ||
            !record.is_valid ||
            record.attempts >= 5
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP expired or too many attempts. Request a new OTP."
            });
        }

        const validOtp = await bcrypt.compare(
            otp,
            record.otp_hash
        );

        if (!validOtp) {
            await incrementStudentLoginOtpAttempts(record.id);

            return res.status(400).json({
                success: false,
                message: "Incorrect OTP."
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing from .env");
        }

        // OTP can be used only once.
        await deleteStudentLoginOtpById(record.id);

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
            message: "Student login successful.",
            token,
            user: {
                userId: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(
            "Verify student OTP error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to verify OTP."
        });
    }
};

// Existing POST /api/auth/forgot-password
// Kept for compatibility with any existing password-reset screen.
const forgotPassword = async (req, res) => {
    try {
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        const genericMessage =
            "If an account exists for that email, a password reset link will be sent.";

        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(200).json({
                success: true,
                message: genericMessage
            });
        }

        await deleteUnusedResetTokens(user.user_id);

        const token = crypto.randomBytes(32).toString("hex");

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const expiresAt = new Date(
            Date.now() + 15 * 60 * 1000
        );

        await createPasswordResetToken(
            user.user_id,
            tokenHash,
            expiresAt
        );

        const frontendUrl =
            process.env.FRONTEND_URL || "http://localhost:5173";

        const resetLink =
            `${frontendUrl}/reset-password?token=${token}`;

        try {
            await sendPasswordResetEmail(
                user.email,
                resetLink
            );
        } catch (emailError) {
            console.error(
                "Password reset email error:",
                emailError.message
            );

            await deleteUnusedResetTokens(user.user_id);

            return res.status(500).json({
                success: false,
                message: "Unable to send the reset email."
            });
        }

        return res.status(200).json({
            success: true,
            message: genericMessage
        });
    } catch (error) {
        console.error(
            "Forgot password error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to process the request."
        });
    }
};

// Existing POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        if (!token || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters."
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const resetRecord =
            await findPasswordResetToken(tokenHash);

        if (!resetRecord || resetRecord.used_at) {
            return res.status(400).json({
                success: false,
                message: "Invalid or already used reset link."
            });
        }

        if (
            new Date(resetRecord.expires_at).getTime() <= Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "Reset link has expired. Request a new one."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await updatePassword(
            resetRecord.user_id,
            passwordHash
        );

        await markPasswordResetTokenUsed(resetRecord.id);

        try {
            const user = await findUserById(resetRecord.user_id);

            if (user && user.email) {
                await sendPasswordChangedEmail(user.email);
            }
        } catch (emailError) {
            console.error(
                "Password notification error:",
                emailError.message
            );
        }

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now log in."
        });
    } catch (error) {
        console.error("Reset password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to reset password."
        });
    }
};

module.exports = {
    login,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    requestStudentLoginOtp,
    verifyStudentLoginOtp
};
