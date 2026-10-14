const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
    findUserByUsername,
    findUserById,
    findUserByEmail,
    createPasswordResetOtp,
    resetPasswordWithOtp
} = require("../models/userModel");

const { sendPasswordResetOtpEmail } = require("../utils/emailService");

const GENERIC_RESET_MESSAGE =
    "If an account exists for this email address, an OTP has been sent to the registered email address.";

const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const createOtpHash = (email, otp) => {
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("OTP_SECRET or JWT_SECRET must be configured");
    }

    return crypto
        .createHmac("sha256", secret)
        .update(`${email}:${otp}`)
        .digest("hex");
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        const user = await findUserByUsername(username);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

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
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
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
                message: "User not found"
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
            message: "Internal server error"
        });
    }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();

        if (!email || !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        // Always return a generic response so account existence is not disclosed.
        const user = await findUserByEmail(email);

        if (user) {
            const otp = crypto
                .randomInt(0, 1000000)
                .toString()
                .padStart(6, "0");

            const otpHash = createOtpHash(email, otp);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await createPasswordResetOtp(
                user.user_id,
                otpHash,
                expiresAt
            );

            try {
                await sendPasswordResetOtpEmail(email, otp);
            } catch (mailError) {
                // Do not log the email address or OTP.
                console.error("Password reset email delivery failed.");
                // Keep the response generic to avoid account enumeration.
            }
        }

        return res.status(200).json({
            success: true,
            message: GENERIC_RESET_MESSAGE
        });
    } catch (error) {
        console.error("Forgot password error:", error.message);

        // Avoid revealing whether an email belongs to an account.
        return res.status(200).json({
            success: true,
            message: GENERIC_RESET_MESSAGE
        });
    }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const otp = String(req.body.otp || "").trim();
        const password = String(req.body.password || "");
        const confirmPassword = String(req.body.confirmPassword || "");

        if (!email || !isValidEmail(email) || !otp || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP, new password and password confirmation are required"
            });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "Enter the 6-digit OTP sent to your email"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        // This project did not define a separate password policy.
        // The reset flow therefore enforces a minimum of 8 characters.
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        const otpHash = createOtpHash(email, otp);
        const passwordHash = await bcrypt.hash(password, 12);

        const result = await resetPasswordWithOtp(
            email,
            otpHash,
            passwordHash
        );

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid, expired, or already-used OTP. Request a new OTP and try again."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Password reset successful. You can now log in with your new password."
        });
    } catch (error) {
        console.error("Reset password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to reset the password right now. Please try again later."
        });
    }
};

module.exports = {
    login,
    getCurrentUser,
    forgotPassword,
    resetPassword
};