const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
    findUserByUsername,
    findUserByEmail,
    findUserById,
    updateLastLogin,
    updatePasswordByUserId,
    createPasswordResetRequest,
    findLatestPasswordResetRequest,
    incrementPasswordResetAttempts,
    verifyPasswordResetOtp,
    findValidPasswordResetToken,
    markPasswordResetTokenUsed
} = require("../models/userModel");
const { validatePassword } = require("../utils/validation");
const { sendPasswordResetOtp } = require("../utils/emailService");

const RESET_REQUEST_MESSAGE =
    "If an account is registered with that email, a password reset OTP has been sent.";

const hashResetValue = (value) =>
    crypto.createHash("sha256").update(value).digest("hex");

const requestPasswordReset = async (req, res) => {
    const email = typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid email address"
        });
    }

    try {
        const user = await findUserByEmail(email);

        if (user) {
            const otp = crypto.randomInt(100000, 1000000).toString();
            const otpHash = hashResetValue(otp);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await createPasswordResetRequest(user.user_id, otpHash, expiresAt);
            await sendPasswordResetOtp(email, otp);
        }

        return res.status(200).json({
            success: true,
            message: RESET_REQUEST_MESSAGE
        });
    } catch (error) {
        console.error("Password reset request error:", error.message);
        return res.status(error.code === "EMAIL_NOT_CONFIGURED" ? 503 : 500).json({
            success: false,
            message: error.code === "EMAIL_NOT_CONFIGURED"
                ? "Password reset email service is not configured"
                : "Unable to process the password reset request"
        });
    }
};

const verifyPasswordResetOtpRequest = async (req, res) => {
    const email = typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const otp = typeof req.body.otp === "string" ? req.body.otp.trim() : "";

    if (!email || !/^\d{6}$/.test(otp)) {
        return res.status(400).json({
            success: false,
            message: "Enter the six-digit OTP sent to your email"
        });
    }

    try {
        const user = await findUserByEmail(email);
        const request = user
            ? await findLatestPasswordResetRequest(user.user_id, new Date())
            : null;

        const submittedOtpHash = hashResetValue(otp);
        const isValidOtp = request &&
            request.attempts < 3 &&
            crypto.timingSafeEqual(
                Buffer.from(request.otp_hash, "hex"),
                Buffer.from(submittedOtpHash, "hex")
            );

        if (!isValidOtp) {
            if (request && request.attempts < 3) {
                await incrementPasswordResetAttempts(request.reset_id);
            }
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        await verifyPasswordResetOtp(
            request.reset_id,
            hashResetValue(resetToken),
            new Date(Date.now() + 10 * 60 * 1000)
        );

        return res.status(200).json({
            success: true,
            message: "OTP verified. You can now set a new password.",
            resetToken
        });
    } catch (error) {
        console.error("Password reset OTP verification error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to verify the OTP"
        });
    }
};

const resetPassword = async (req, res) => {
    const resetToken = typeof req.body.resetToken === "string"
        ? req.body.resetToken.trim()
        : "";
    const { password, confirmPassword } = req.body;
    const passwordError = validatePassword(password);

    if (!resetToken || !password || password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: password !== confirmPassword
                ? "Passwords do not match"
                : "Reset token and both password fields are required"
        });
    }

    if (passwordError) {
        return res.status(400).json({
            success: false,
            message: passwordError
        });
    }

    try {
        const resetRequest = await findValidPasswordResetToken(
            hashResetValue(resetToken),
            new Date()
        );

        if (!resetRequest) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset request"
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        await updatePasswordByUserId(resetRequest.user_id, passwordHash);
        await markPasswordResetTokenUsed(resetRequest.reset_id);

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now sign in."
        });
    } catch (error) {
        console.error("Password reset error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to reset the password"
        });
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

        await updateLastLogin(user.user_id);

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

module.exports = {
    login,
    getCurrentUser,
    requestPasswordReset,
    verifyPasswordResetOtpRequest,
    resetPassword
};
