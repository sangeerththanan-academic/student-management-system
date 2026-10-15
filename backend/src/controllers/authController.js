const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const {
    findUserByUsername,
    findUserById,
    updateLastLogin,
    findUserByEmail,
    createPasswordResetOtp,
    findPasswordResetOtp,
    incrementPasswordResetOtpAttempts,
    markPasswordResetOtpVerified,
    deletePasswordResetOtps,
    createPasswordResetToken,
    findPasswordResetToken,
    markPasswordResetTokenUsed,
    updatePassword,
    deleteUnusedResetTokens
} = require("../models/userModel");

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRY_MINUTES = 10;

// Email configuration
const createMailer = () => {
    const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        SMTP_FROM
    } = process.env;

    if (
        !SMTP_HOST ||
        !SMTP_PORT ||
        !SMTP_USER ||
        !SMTP_PASS ||
        !SMTP_FROM
    ) {
        throw new Error(
            "SMTP email configuration is missing."
        );
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });
};

// Send OTP email

const sendResetOtpEmail = async (email, otp) => {
    const transporter = createMailer();

    // Check SMTP connection and authentication
    await transporter.verify();

    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Password Reset Verification Code",
        text: `Your password reset verification code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes. If you did not request this, ignore this email.`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Password Reset</h2>
                <p>Your verification code is:</p>
                <h1 style="letter-spacing: 8px;">${otp}</h1>
                <p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
                <p>If you did not request this, ignore this email.</p>
            </div>
        `
    });
    

    // Log delivery diagnostics, never the OTP
    console.log("SMTP message ID:", info.messageId);
    console.log("Accepted recipients:", info.accepted);
    console.log("Rejected recipients:", info.rejected);

    if (
        !info.accepted?.some(
            address => address.toLowerCase() === email.toLowerCase()
        )
    ) {
        throw new Error("SMTP did not accept the recipient address.");
    }

    return info;
};


// Hash OTP and reset tokens before storing
const hashValue = (value) => {
    return crypto
        .createHash("sha256")
        .update(value)
        .digest("hex");
};

// =====================================
// LOGIN
// =====================================

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Username and password are required"
            });
        }

        const user = await findUserByUsername(
            username.trim()
        );

        if (
            !user ||
            !(await bcrypt.compare(
                password,
                user.password_hash
            ))
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // Update last login for student accounts
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
                expiresIn:
                    process.env.JWT_EXPIRES_IN || "1d"
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

// =====================================
// GET CURRENT USER
// =====================================

const getCurrentUser = async (req, res) => {
    try {
        const user = await findUserById(
            req.user.userId
        );

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
        console.error(
            "Get current user error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// =====================================
// STEP 1: SEND OTP TO EMAIL
// =====================================

const forgotPassword = async (req, res) => {
    try {
        const email = String(
            req.body.email || ""
        ).trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email address is required"
            });
        }

        const user = await findUserByEmail(email);

        // Use a generic response for account privacy.
        const genericMessage =
            "If an account exists for this email address, a verification code has been sent.";

        if (!user) {
            return res.status(200).json({
                success: true,
                message: genericMessage
            });
        }

        // Remove previous OTPs and unused reset tokens.
        await deletePasswordResetOtps(user.user_id);
        await deleteUnusedResetTokens(user.user_id);

        // Generate a random 6-digit OTP.
        const otp = crypto
            .randomInt(100000, 1000000)
            .toString();

        // Store only the hash of the OTP.
        const otpHash = hashValue(otp);

        const expiresAt = new Date(
            Date.now() +
            OTP_EXPIRY_MINUTES * 60 * 1000
        );

        await createPasswordResetOtp(
            user.user_id,
            otpHash,
            expiresAt
        );

        try {
            await sendResetOtpEmail(email, otp);
        } catch (emailError) {
            await deletePasswordResetOtps(
                user.user_id
            );

            console.error(
                "Email sending error:",
                emailError.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to send the verification email. Check the email configuration and try again."
            });
        }

        // Never return the OTP in the API response.
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
            message: "Internal server error"
        });
    }
};

// =====================================
// STEP 2: VERIFY OTP
// =====================================

const verifyResetOtp = async (req, res) => {
    try {
        const email = String(
            req.body.email || ""
        ).trim().toLowerCase();

        const otp = String(
            req.body.otp || ""
        ).trim();

        if (
            !email ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Enter your email and the 6-digit verification code."
            });
        }

        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid or expired verification code."
            });
        }

        const otpRecord =
            await findPasswordResetOtp(user.user_id);

        if (
            !otpRecord ||
            otpRecord.used_at ||
            otpRecord.verified_at
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid or expired verification code."
            });
        }

        // Check expiry.
        if (
            new Date(otpRecord.expires_at) <=
            new Date()
        ) {
            await deletePasswordResetOtps(
                user.user_id
            );

            return res.status(400).json({
                success: false,
                message:
                    "Verification code expired. Please request a new code."
            });
        }

        // Limit incorrect attempts.
        if (
            Number(otpRecord.attempts) >=
            MAX_OTP_ATTEMPTS
        ) {
            await deletePasswordResetOtps(
                user.user_id
            );

            return res.status(429).json({
                success: false,
                message:
                    "Too many incorrect attempts. Please request a new code."
            });
        }

        // Compare the submitted OTP hash.
        if (hashValue(otp) !== otpRecord.otp_hash) {
            await incrementPasswordResetOtpAttempts(
                otpRecord.id
            );

            return res.status(400).json({
                success: false,
                message:
                    "Invalid or expired verification code."
            });
        }

        // Mark OTP as verified.
        await markPasswordResetOtpVerified(
            otpRecord.id
        );

        // Create a new random reset token only after
        // successful OTP verification.
        const resetToken = crypto
            .randomBytes(32)
            .toString("hex");

        const tokenHash = hashValue(resetToken);

        const tokenExpiresAt = new Date(
            Date.now() +
            RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
        );

        await deleteUnusedResetTokens(
            user.user_id
        );

        await createPasswordResetToken(
            user.user_id,
            tokenHash,
            tokenExpiresAt
        );

        return res.status(200).json({
            success: true,
            message:
                "Email verified. You can now reset your password.",
            resetToken
        });
    } catch (error) {
        console.error(
            "Verify OTP error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// =====================================
// STEP 3: RESET PASSWORD
// =====================================

const resetPassword = async (req, res) => {
    try {
        const {
            token,
            password,
            confirmPassword
        } = req.body;

        if (
            !token ||
            !password ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Reset token, password and confirmation are required."
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters long."
            });
        }

        // Search using the hash, not the raw token.
        const resetRecord =
            await findPasswordResetToken(
                hashValue(token)
            );

        if (
            !resetRecord ||
            resetRecord.used_at ||
            new Date(resetRecord.expires_at) <=
                new Date()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid or expired reset session. Please verify your email again."
            });
        }

        // Hash the new password before storing it.
        const passwordHash = await bcrypt.hash(
            password,
            12
        );

        await updatePassword(
            resetRecord.user_id,
            passwordHash
        );

        // Prevent the reset token from being reused.
        await markPasswordResetTokenUsed(
            resetRecord.id
        );

        await deletePasswordResetOtps(
            resetRecord.user_id
        );

        return res.status(200).json({
            success: true,
            message:
                "Password reset successful. You can now log in with your new password."
        });
    } catch (error) {
        console.error(
            "Reset password error:",
            error.message
        );

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