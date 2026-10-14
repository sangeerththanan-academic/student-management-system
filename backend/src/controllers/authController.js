const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
    findUserByUsername,
    findUserById,
    findUserByEmail,
    createPasswordResetToken,
    findLatestResetTokenForUser,
    findPasswordResetToken,
    incrementTokenAttempts,
    markPasswordResetTokenUsed,
    updatePassword,
    deleteUnusedResetTokens
} = require("../models/userModel");

const { sendOTPEmail } = require("../utils/emailService");

// Password complexity validation
const validatePasswordStrength = (password) => {
    if (!password || password.length < 8) {
        return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
    }
    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number.";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return "Password must contain at least one special character.";
    }
    return null;
};

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
// FORGOT PASSWORD (OTP GENERATION & DISPATCH)
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

        const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailPattern.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "This mail is not registered."
            });
        }

        // Invalidate previous unused reset tokens for this user
        await deleteUnusedResetTokens(user.user_id);

        // Generate cryptographically secure 6-digit numeric OTP (100000 - 999999)
        const otp = crypto.randomInt(100000, 1000000).toString();

        // Store SHA-256 hash of the OTP
        const tokenHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        // OTP expires in 10 minutes
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await createPasswordResetToken(
            user.user_id,
            tokenHash,
            expiresAt
        );

        // Dispatch OTP via Google App Password SMTP
        try {
            await sendOTPEmail(email, otp);
        } catch (mailError) {
            console.error("Failed to send OTP email:", mailError);
            return res.status(500).json({
                success: false,
                message: "Failed to dispatch verification email. Please try again later."
            });
        }

        return res.status(200).json({
            success: true,
            message: "A verification code (OTP) has been sent to your email address."
        });

    } catch (error) {
        console.error("Forgot password error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ==========================================
// VERIFY OTP (OPTIONAL PRE-VALIDATION)
// ==========================================

const verifyOtp = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const otp = String(req.body.otp || "").trim();

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and verification code are required"
            });
        }

        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code"
            });
        }

        const tokenRecord = await findLatestResetTokenForUser(user.user_id);
        if (!tokenRecord || tokenRecord.used_at) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code"
            });
        }

        // Check expiration
        if (new Date(tokenRecord.expires_at) <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Verification code has expired. Please request a new code."
            });
        }

        // Check attempts (max 3)
        if (tokenRecord.attempts >= 3) {
            return res.status(400).json({
                success: false,
                message: "Maximum attempts exceeded. Please request a new verification code."
            });
        }

        const enteredHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        if (tokenRecord.token_hash !== enteredHash) {
            await incrementTokenAttempts(tokenRecord.id);
            const remaining = 3 - (tokenRecord.attempts + 1);

            if (remaining <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid verification code. Maximum attempts exceeded. Please request a new code."
                });
            }

            return res.status(400).json({
                success: false,
                message: `Invalid verification code. ${remaining} attempt(s) remaining.`
            });
        }

        return res.status(200).json({
            success: true,
            message: "Verification code verified successfully."
        });

    } catch (error) {
        console.error("Verify OTP error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ==========================================
// RESET PASSWORD
// Supports both { email, otp, password, confirmPassword }
// and legacy token { token, password, confirmPassword }
// ==========================================

const resetPassword = async (req, res) => {
    try {
        const {
            email: rawEmail,
            otp: rawOtp,
            token,
            password,
            confirmPassword
        } = req.body;

        const email = rawEmail?.trim().toLowerCase();
        const otp = rawOtp !== undefined ? String(rawOtp).trim() : null;

        if (!password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and confirmation are required"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        const passwordError = validatePasswordStrength(password);
        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }

        let resetTokenRecord = null;
        let userId = null;

        if (otp && email) {
            // OTP verification flow
            const user = await findUserByEmail(email);

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired verification code"
                });
            }

            userId = user.user_id;
            resetTokenRecord = await findLatestResetTokenForUser(userId);

            if (!resetTokenRecord || resetTokenRecord.used_at) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired verification code"
                });
            }

            if (new Date(resetTokenRecord.expires_at) <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: "Verification code has expired. Please request a new code."
                });
            }

            if (resetTokenRecord.attempts >= 3) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum attempts exceeded. Please request a new verification code."
                });
            }

            const enteredHash = crypto
                .createHash("sha256")
                .update(otp)
                .digest("hex");

            if (resetTokenRecord.token_hash !== enteredHash) {
                await incrementTokenAttempts(resetTokenRecord.id);
                const remaining = 3 - (resetTokenRecord.attempts + 1);

                if (remaining <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid verification code. Maximum attempts exceeded. Please request a new code."
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: `Invalid verification code. ${remaining} attempt(s) remaining.`
                });
            }

        } else if (token) {
            // Legacy token flow (URL query token)
            const tokenHash = crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");

            resetTokenRecord = await findPasswordResetToken(tokenHash);

            if (!resetTokenRecord) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired password reset token"
                });
            }

            if (resetTokenRecord.used_at) {
                return res.status(400).json({
                    success: false,
                    message: "This password reset token has already been used"
                });
            }

            if (new Date(resetTokenRecord.expires_at) <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: "This password reset token has expired"
                });
            }

            userId = resetTokenRecord.user_id;

        } else {
            return res.status(400).json({
                success: false,
                message: "Verification code and email are required"
            });
        }

        // Hash new password using bcrypt (12 rounds)
        const passwordHash = await bcrypt.hash(password, 12);

        // Update user's password
        await updatePassword(userId, passwordHash);

        // Invalidate the reset token
        await markPasswordResetTokenUsed(resetTokenRecord.id);

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
    verifyOtp,
    resetPassword
};
