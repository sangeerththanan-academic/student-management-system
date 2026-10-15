const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../config/db");

const {
    findUserByUsername,
    findUserById
} = require("../models/userModel");

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const username =
            typeof req.body.username === "string"
                ? req.body.username.trim()
                : "";

        const password =
            typeof req.body.password === "string"
                ? req.body.password
                : "";

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        // Find the account by username.
        const user = await findUserByUsername(username);

        if (!user || !user.password_hash) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // Verify the password.
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

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing from backend .env");

            return res.status(500).json({
                success: false,
                message: "Server configuration error"
            });
        }

        // Update last_login in the background for student accounts.
        // Do not wait for this query before returning the login response.
        if (String(user.role).toUpperCase() === "STUDENT") {
            pool.execute(
                `UPDATE users
                 SET last_login = NOW()
                 WHERE user_id = ?`,
                [user.user_id]
            ).catch((error) => {
                console.error(
                    "Last login update failed:",
                    error.code || "",
                    error.message
                );
            });
        }

        // Create the token after the credentials have been verified.
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
        console.error("Get current user error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    login,
    getCurrentUser
};
