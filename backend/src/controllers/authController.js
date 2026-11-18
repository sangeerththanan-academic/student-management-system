const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
    findUserByUsername,
    findUserById,
    updateLastLogin,
    findUserByEmail,
    updateUserPassword
} = require("../models/userModel");

const {
    createPasswordResetToken,
    findValidResetToken,
    inspectResetToken,
    markTokenAsUsed
} = require("../models/passwordResetModel");

const {
    sendPasswordResetEmail
} = require("../services/emailService");

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

        // CR033: Record successful login timestamp (FR-002)
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

// CR-026: Request password reset (FR-001, FR-002, FR-003, FR-004, SEC-004, SEC-005, SEC-008)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter an email address."
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        const user = await findUserByEmail(email.trim());

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "This email address is not registered in our system. Please check the email and try again."
            });
        }

        // Generate cryptographically secure 6-digit OTP with 15 min expiry (SEC-004, SEC-005)
        const { token: otp } = await createPasswordResetToken(user.user_id);

        // Deliver 6-digit OTP strictly via SMTP server
        const recipientEmail = user.email || email.trim();
        try {
            await sendPasswordResetEmail(recipientEmail, otp);
        } catch (emailErr) {
            console.error("[AUTH] SMTP dispatch failure:", emailErr.message);
            return res.status(500).json({
                success: false,
                message: "Unable to send verification code via SMTP server. Please ensure SMTP configuration is active in backend/.env."
            });
        }

        return res.status(200).json({
            success: true,
            message: `A 6-digit verification code has been sent to your email address (${recipientEmail}).`
        });

    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error processing password reset request."
        });
    }
};

// CR-026: Verify password reset OTP / token validity (FR-007, SEC-005, SEC-006, TC-005, TC-006, TC-007)
const verifyResetToken = async (req, res) => {
    try {
        const rawToken = req.body.otp || req.body.token || req.query.token || req.query.otp;
        const email = req.body.email || req.query.email;

        if (!rawToken) {
            return res.status(400).json({
                success: false,
                message: "Verification code (OTP) is required."
            });
        }

        let userId = null;
        if (email) {
            const user = await findUserByEmail(email.trim());
            if (user) userId = user.user_id;
        }

        const validToken = await findValidResetToken(rawToken, userId);

        if (!validToken) {
            const inspected = await inspectResetToken(rawToken);
            let reason = "Verification code is invalid, expired, or has already been used.";
            if (inspected && inspected.used) {
                reason = "This verification code has already been used. Please request a new one.";
            } else if (inspected && inspected.is_expired) {
                reason = "This verification code has expired (15-minute limit). Please request a new one.";
            }

            return res.status(400).json({
                success: false,
                message: reason
            });
        }

        return res.status(200).json({
            success: true,
            message: "Verification code confirmed successfully.",
            token: validToken.token
        });

    } catch (error) {
        console.error("Verify reset token error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error verifying verification code."
        });
    }
};

// CR-026: Reset password using verified OTP / token (FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, SEC-002, SEC-003, SEC-006)
const resetPassword = async (req, res) => {
    try {
        const { token, otp, email, password, confirmPassword } = req.body;
        const resetToken = (otp || token || "").toString().trim();

        if (!resetToken) {
            return res.status(400).json({
                success: false,
                message: "Verification code (OTP) is required."
            });
        }

        if (!password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Please fill in both the new password and confirmation password."
            });
        }

        // FR-009 / TC-008: Password confirmation validation
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match. Please re-enter."
            });
        }

        // FR-010 / TC-009: Password policy validation (minimum 6 characters)
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long."
            });
        }

        let userId = null;
        if (email) {
            const user = await findUserByEmail(email.trim());
            if (user) userId = user.user_id;
        }

        // FR-007 / SEC-005 / SEC-006 / TC-006 / TC-007 / TC-013: Validate token
        const resetRecord = await findValidResetToken(resetToken, userId);

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: "Verification code is invalid, expired, or has already been used."
            });
        }

        // FR-011 / SEC-002 / SEC-003 / TC-014: Bcrypt hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user's password in database
        await updateUserPassword(resetRecord.user_id, hashedPassword);

        // SEC-006 / TC-013: Invalidate used token so it cannot be reused
        await markTokenAsUsed(resetRecord.id);

        return res.status(200).json({
            success: true,
            message: "Password has been successfully reset! You can now log in with your new password."
        });

    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error completing password reset."
        });
    }
};

module.exports = {
    login,
    getCurrentUser,
    forgotPassword,
    verifyResetToken,
    resetPassword
};
