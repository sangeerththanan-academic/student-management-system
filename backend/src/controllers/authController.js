
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
    findUserByUsername,
    findUserById,
    findUserByEmail,
    updatePassword,
    deletePreviousOtps,
    createPasswordResetOtp,
    findLatestPasswordResetOtp,
    incrementOtpAttempts,
    markOtpUsed
} = require("../models/userModel");

const {
    generateOTP,
    hashOTP,
    safeHashCompare
} = require("../services/otpService");

const {
    sendPasswordOtpEmail
} = require("../services/emailService");


// ==========================================
// LOGIN
// ==========================================

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
        console.error("Get current user error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// ==========================================
// FORGOT PASSWORD - SEND EMAIL OTP
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

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "This email address is not registered."
            });
        }

        // Invalidate previously issued OTPs.
        await deletePreviousOtps(user.user_id);

        // Generate a cryptographically secure six-digit OTP.
        const otp = generateOTP();

        // Store only the OTP hash in the database.
        const otpHash = hashOTP(otp);

        // OTP expires after five minutes.
        const expiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        await createPasswordResetOtp(
            user.user_id,
            otpHash,
            expiresAt
        );

        try {
            // Send the OTP to the registered email address.
            await sendPasswordOtpEmail(user.email, otp);
        } catch (emailError) {
            // Do not leave an active OTP if email delivery fails.
            await deletePreviousOtps(user.user_id);

            console.error(
                "Password reset email delivery failed:",
                emailError.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to send the OTP right now. Please try again later."
            });
        }

        return res.status(200).json({
            success: true,
            message: "An OTP has been sent to your registered email address."
        });

    } catch (error) {
        console.error("Forgot password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to process your request right now."
        });
    }
};


// ==========================================
// RESET PASSWORD - VERIFY OTP
// ==========================================

const resetPassword = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const { otp, password, confirmPassword } = req.body;

        if (!email || !otp || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Email, OTP, password and password confirmation are required."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        if (!/^\d{6}$/.test(String(otp))) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid six-digit OTP."
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

        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP."
            });
        }

        const resetOtp = await findLatestPasswordResetOtp(
            user.user_id
        );

        if (!resetOtp || resetOtp.used_at) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP."
            });
        }

        if (resetOtp.attempts >= 5) {
            return res.status(429).json({
                success: false,
                message:
                    "Too many incorrect OTP attempts. Please request a new OTP."
            });
        }

        if (new Date(resetOtp.expires_at) <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Your OTP has expired. Please request a new one."
            });
        }

        // Compare the submitted OTP against its stored hash.
        const otpMatches = safeHashCompare(
            resetOtp.otp_hash,
            String(otp)
        );

        if (!otpMatches) {
            await incrementOtpAttempts(resetOtp.id);

            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP."
            });
        }

        // Claim the OTP before changing the password.
        // Only one request can successfully mark it as used.
        const otpClaimed = await markOtpUsed(resetOtp.id);

        if (!otpClaimed) {
            return res.status(400).json({
                success: false,
                message:
                    "This OTP has expired or has already been used. Please request a new OTP."
            });
        }

        // Hash the new password before storing it.
        const passwordHash = await bcrypt.hash(password, 12);

        await updatePassword(
            user.user_id,
            passwordHash
        );

        // Invalidate any other outstanding OTPs for this account.
        await deletePreviousOtps(user.user_id);

        return res.status(200).json({
            success: true,
            message:
                "Password reset successful. You can now log in with your new password."
        });

    } catch (error) {
        console.error("Reset password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to reset your password right now."
        });
    }
};


// ==========================================
// EXPORT CONTROLLER FUNCTIONS
// ==========================================

module.exports = {
    login,
    getCurrentUser,
    forgotPassword,
    resetPassword
};
