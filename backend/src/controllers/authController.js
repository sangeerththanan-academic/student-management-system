const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const {
    findUserByUsername,
    findUserById,
    updateLastLogin,
    findUserByEmail,
    createPasswordResetToken,
    findPasswordResetToken,
    markPasswordResetTokenUsed,
    updatePassword,
    deleteUnusedResetTokens,
    deletePasswordResetOtps,
    createPasswordResetOtp,
    findLatestPasswordResetOtp,
    incrementPasswordResetOtpAttempts,
    markPasswordResetOtpVerified
} = require("../models/userModel");

// ==========================================
// LOGIN
// ==========================================

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (
            typeof username !== "string" ||
            !username.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        const user = await findUserByUsername(username.trim());

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

        if (user.role === "STUDENT") {
            await updateLastLogin(user.user_id);
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
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ==========================================
// GET CURRENT USER
// ==========================================

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

// ==========================================
// EMAIL TRANSPORTER
// ==========================================

const createEmailTransporter = () => {
    if (
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_APP_PASSWORD
    ) {
        throw new Error("Gmail SMTP configuration is missing");
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        }
    });
};

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

        const user = await findUserByEmail(email);

        const genericMessage =
            "If an account exists for this email address, an OTP has been sent.";

        if (!user) {
            return res.status(200).json({
                success: true,
                message: genericMessage
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();

        const otpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        const expiryMinutes = Math.max(
            1,
            Math.min(
                10,
                Number.parseInt(
                    process.env.OTP_EXPIRY_MINUTES,
                    10
                ) || 5
            )
        );

        const expiresAt = new Date(
            Date.now() + expiryMinutes * 60 * 1000
        );

        const transporter = createEmailTransporter();

        // Remove previous OTPs and outstanding reset tokens.
        await deletePasswordResetOtps(user.user_id);
        await deleteUnusedResetTokens(user.user_id);

        await createPasswordResetOtp(
            user.user_id,
            otpHash,
            expiresAt
        );

        try {
            await transporter.sendMail({
                from: `"Student Management System" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: "Your Password Reset OTP",
                text:
                    `Hello ${user.username},\n\n` +
                    `Your password reset OTP is: ${otp}\n\n` +
                    `This code expires in ${expiryMinutes} minutes. ` +
                    `Do not share it with anyone.\n\n` +
                    `If you did not request this, please ignore this email.`
            });
        } catch (mailError) {
            await deletePasswordResetOtps(user.user_id);
            throw mailError;
        }

        return res.status(200).json({
            success: true,
            message: genericMessage
        });
    } catch (error) {
        console.error("Forgot password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to send OTP. Please check the email configuration and try again."
        });
    }
};

// ==========================================
// VERIFY RESET OTP
// ==========================================

const verifyResetOtp = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const otp = String(req.body.otp || "").trim();

        if (!email || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "A valid email and 6-digit OTP are required"
            });
        }

        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        const savedOtp = await findLatestPasswordResetOtp(
            user.user_id
        );

        if (
            !savedOtp ||
            savedOtp.verified_at ||
            new Date(savedOtp.expires_at).getTime() <= Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        if (savedOtp.attempts >= 5) {
            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Request a new OTP."
            });
        }

        const submittedHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        const submittedBuffer = Buffer.from(submittedHash, "hex");
        const savedBuffer = Buffer.from(savedOtp.otp_hash, "hex");

        const matches =
            submittedBuffer.length === savedBuffer.length &&
            crypto.timingSafeEqual(
                submittedBuffer,
                savedBuffer
            );

        if (!matches) {
            await incrementPasswordResetOtpAttempts(savedOtp.id);

            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        // Issue a short-lived reset token after OTP verification.
        const resetToken = crypto.randomBytes(32).toString("hex");

        const tokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        const tokenExpiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        await createPasswordResetToken(
            user.user_id,
            tokenHash,
            tokenExpiresAt
        );

        const verificationResult =
            await markPasswordResetOtpVerified(savedOtp.id);

        if (verificationResult.affectedRows !== 1) {
            await deleteUnusedResetTokens(user.user_id);

            return res.status(400).json({
                success: false,
                message: "OTP could not be verified. Request a new OTP."
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            resetToken
        });
    } catch (error) {
        console.error("Verify reset OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify OTP. Please try again."
        });
    }
};

// ==========================================
// RESET PASSWORD
// ==========================================

const resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        if (
            typeof token !== "string" ||
            !token ||
            typeof password !== "string" ||
            typeof confirmPassword !== "string" ||
            !password ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "Token, password and password confirmation are required"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        // Enforce strong password requirements.
        const strongPassword =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (!strongPassword.test(password)) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters and include uppercase, lowercase, number and special character"
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const resetToken = await findPasswordResetToken(tokenHash);

        if (!resetToken || resetToken.used_at) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset token"
            });
        }

        if (
            new Date(resetToken.expires_at).getTime() <= Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "This password reset token has expired"
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // Only consume the token after the password is updated.
        const result = await updatePassword(
            resetToken.user_id,
            passwordHash
        );

        if (result.affectedRows !== 1) {
            return res.status(400).json({
                success: false,
                message: "Unable to update password"
            });
        }

        await markPasswordResetTokenUsed(resetToken.id);
        await deletePasswordResetOtps(resetToken.user_id);

        return res.status(200).json({
            success: true,
            message: "Password reset successful. You can now log in with your new password."
        });
    } catch (error) {
        console.error("Reset password error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};



module.exports = {
    login,
    getCurrentUser,
    forgotPassword,
    verifyResetOtp,
    resetPassword
};