const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const {
    findUserByUsername,
    findUserById,
    findUserByIdWithPassword,
    updatePasswordHash
} = require("../models/userModel");
const {
    shouldTrackStudentLogin
} = require("../utils/loginTracking");

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
    changePassword
};
