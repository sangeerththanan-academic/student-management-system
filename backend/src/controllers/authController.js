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
    deleteUnusedResetTokens
} = require("../models/userModel");


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
// FORGOT PASSWORD
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

        /*
         * Generic response prevents unnecessary
         * account enumeration.
         */
        if (!user) {
            return res.status(200).json({
                success: true,
                message:
                    "If an account exists for this email address, password reset instructions have been sent."
            });
        }

        /*
         * Remove previous unused reset tokens.
         */
        await deleteUnusedResetTokens(user.user_id);

        /*
         * Generate a cryptographically secure token.
         */
        const resetToken = crypto.randomBytes(32).toString("hex");

        /*
         * Store only the hash of the token.
         */
        const tokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        /*
         * Token valid for 15 minutes.
         */
        const expiresAt = new Date(
            Date.now() + 15 * 60 * 1000
        );

        await createPasswordResetToken(
            user.user_id,
            tokenHash,
            expiresAt
        );

        /*
         * Development implementation.
         *
         * In production, this token should be sent
         * through an email service instead of returning
         * it in the API response.
         */
        console.log(
            `Password reset token for ${email}: ${resetToken}`
        );

        return res.status(200).json({
            success: true,
            message:
                "If an account exists for this email address, password reset instructions have been sent.",

            /*
             * DEVELOPMENT ONLY
             * Remove this before production.
             */
            resetToken
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
// RESET PASSWORD
// ==========================================

const resetPassword = async (req, res) => {
    try {
        const {
            token,
            password,
            confirmPassword
        } = req.body;

        if (!token || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Token, password and password confirmation are required"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        /*
         * Password policy.
         *
         * Adjust this if your existing project
         * already has a specific password policy.
         */
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters long"
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const resetToken = await findPasswordResetToken(
            tokenHash
        );

        if (!resetToken) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset token"
            });
        }

        if (resetToken.used_at) {
            return res.status(400).json({
                success: false,
                message: "This password reset token has already been used"
            });
        }

        const currentTime = new Date();

        if (
            new Date(resetToken.expires_at) <= currentTime
        ) {
            return res.status(400).json({
                success: false,
                message: "This password reset token has expired"
            });
        }

        /*
         * Hash the new password.
         */
        const passwordHash = await bcrypt.hash(
            password,
            12
        );

        await updatePassword(
            resetToken.user_id,
            passwordHash
        );

        /*
         * Invalidate the token.
         */
        await markPasswordResetTokenUsed(
            resetToken.id
        );

        return res.status(200).json({
            success: true,
            message:
                "Password reset successful. You can now log in with your new password."
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
    resetPassword
};
