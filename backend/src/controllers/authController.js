<<<<<<< HEAD
=======
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// const pool = require("../config/db");

// const {
//     findUserByUsername,
//     findUserById
// } = require("../models/userModel");

// // POST /api/auth/login
// const login = async (req, res) => {
//     try {
//         const username =
//             typeof req.body.username === "string"
//                 ? req.body.username.trim()
//                 : "";

//         const password =
//             typeof req.body.password === "string"
//                 ? req.body.password
//                 : "";

//         if (!username || !password) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Username and password are required"
//             });
//         }

//         // Find the account by username.
//         const user = await findUserByUsername(username);

//         if (!user || !user.password_hash) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid username or password"
//             });
//         }

//         // Verify the password.
//         const passwordMatch = await bcrypt.compare(
//             password,
//             user.password_hash
//         );

//         if (!passwordMatch) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid username or password"
//             });
//         }

//         if (!process.env.JWT_SECRET) {
//             console.error("JWT_SECRET is missing from backend .env");

//             return res.status(500).json({
//                 success: false,
//                 message: "Server configuration error"
//             });
//         }

//         // Update last_login in the background for student accounts.
//         // Do not wait for this query before returning the login response.
//         if (String(user.role).toUpperCase() === "STUDENT") {
//             pool.execute(
//                 `UPDATE users
//                  SET last_login = NOW()
//                  WHERE user_id = ?`,
//                 [user.user_id]
//             ).catch((error) => {
//                 console.error(
//                     "Last login update failed:",
//                     error.code || "",
//                     error.message
//                 );
//             });
//         }

//         // Create the token after the credentials have been verified.
//         const token = jwt.sign(
//             {
//                 userId: user.user_id,
//                 username: user.username,
//                 role: user.role
//             },
//             process.env.JWT_SECRET,
//             {
//                 expiresIn: process.env.JWT_EXPIRES_IN || "1d"
//             }
//         );

//         return res.status(200).json({
//             success: true,
//             message: "Login successful",
//             token,
//             user: {
//                 id: user.user_id,
//                 username: user.username,
//                 role: user.role
//             }
//         });
//     } catch (error) {
//         console.error("Login error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Internal server error"
//         });
//     }
// };

// // GET /api/auth/me
// const getCurrentUser = async (req, res) => {
//     try {
//         const user = await findUserById(req.user.userId);

//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             user
//         });
//     } catch (error) {
//         console.error("Get current user error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Internal server error"
//         });
//     }
// };

// module.exports = {
//     login,
//     getCurrentUser
// };




>>>>>>> JFICT10/CR026
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const pool = require("../config/db");

const {
    findUserByUsername,
    findUserById
} = require("../models/userModel");

// ============================================================
// OTP HASH
// ============================================================

const hashOtp = (otp) =>
    crypto.createHash("sha256").update(otp).digest("hex");

// ============================================================
// GMAIL SMTP CONFIGURATION
// ============================================================

// Remove accidental spaces from the Gmail App Password.
// Never print SMTP credentials in the terminal.

const smtpUser = (process.env.SMTP_USER || "").trim();
const smtpPass = (process.env.SMTP_PASS || "").replace(/\s/g, "");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false")
        .trim()
        .toLowerCase() === "true",
    auth: {
        user: smtpUser,
        pass: smtpPass
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
});



// ============================================================
// POST /api/auth/login
// ============================================================

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

        const user = await findUserByUsername(username);

        if (
            !user ||
            !user.password_hash ||
            !(await bcrypt.compare(password, user.password_hash))
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing.");

            return res.status(500).json({
                success: false,
                message: "Server configuration error"
            });
        }

        if (String(user.role).toUpperCase() === "STUDENT") {
            pool.execute(
                "UPDATE users SET last_login = NOW() WHERE user_id = ?",
                [user.user_id]
            ).catch((error) => {
                console.error(
                    "Last login update failed:",
                    error.code || "",
                    error.message
                );
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
        console.error(
            "Login error:",
            error.code || "",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ============================================================
// GET /api/auth/me
// ============================================================

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

// ============================================================
// POST /api/auth/forgot-password
// ============================================================

const forgotPassword = async (req, res) => {
    try {
        const email =
            typeof req.body.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "";

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid email address"
            });
        }

        if (!smtpUser || !smtpPass) {
            console.error(
                "SMTP configuration missing. Check SMTP_USER and SMTP_PASS."
            );

            return res.status(500).json({
                success: false,
                message: "Email service is not configured"
            });
        }

        // Student email is stored in students.email.
        const [users] = await pool.execute(
            `SELECT u.user_id, u.username
             FROM users u
             INNER JOIN students s ON s.user_id = u.user_id
             WHERE LOWER(s.email) = ?
               AND UPPER(u.role) = 'STUDENT'
             LIMIT 1`,
            [email]
        );

        // Do not reveal whether the account exists.
        if (users.length === 0) {
            return res.status(200).json({
                success: true,
                message:
                    "If that email belongs to an account, an OTP will be sent."
            });
        }

        const user = users[0];

        const otp = crypto
            .randomInt(0, 1000000)
            .toString()
            .padStart(6, "0");

        const otpHash = hashOtp(otp);

        // Invalidate previous unused OTPs.
        await pool.execute(
            `UPDATE password_reset_otps
             SET used_at = NOW()
             WHERE user_id = ?
               AND used_at IS NULL`,
            [user.user_id]
        );

        // Save a new OTP with a 10-minute expiry.
        await pool.execute(
            `INSERT INTO password_reset_otps
                (user_id, otp_hash, expires_at, attempts)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0)`,
            [user.user_id, otpHash]
        );

        try {
            await transporter.sendMail({
                from: {
                    name: "Student Management System",
                    address: smtpUser
                },
                to: email,
                subject: "Your password reset OTP",
                text:
                    `Hello ${user.username},\n\n` +
                    `Your password reset OTP is: ${otp}\n\n` +
                    "This OTP expires in 10 minutes and can only be used once.\n" +
                    "If you did not request this, you can ignore this email."
            });

            console.log("Password reset email sent successfully.");
        } catch (mailError) {
            // Log diagnostic information, never log passwords or OTPs.
            console.error("SMTP ERROR CODE:", mailError.code || "UNKNOWN");
            console.error("SMTP ERROR MESSAGE:", mailError.message);
            console.error(
                "SMTP RESPONSE CODE:",
                mailError.responseCode || "N/A"
            );
            console.error(
                "SMTP RESPONSE:",
                mailError.response || "N/A"
            );

            // Invalidate the OTP even if this cleanup fails.
            try {
                await pool.execute(
                    `UPDATE password_reset_otps
                     SET used_at = NOW()
                     WHERE user_id = ?
                       AND otp_hash = ?
                       AND used_at IS NULL`,
                    [user.user_id, otpHash]
                );
            } catch (cleanupError) {
                console.error(
                    "OTP cleanup failed:",
                    cleanupError.code || "",
                    cleanupError.message
                );
            }

            return res.status(500).json({
                success: false,
                message: "Could not send the email. Check SMTP settings."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "If that email belongs to an account, an OTP will be sent."
        });
    } catch (error) {
        console.error(
            "Forgot password error:",
            error.code || "",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Could not process the password reset request"
        });
    }
};

// ============================================================
// POST /api/auth/verify-reset-otp
// ============================================================

const verifyResetOtp = async (req, res) => {
    try {
        const email =
            typeof req.body.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "";

        const otp =
            typeof req.body.otp === "string"
                ? req.body.otp.trim()
                : "";

        if (!email || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "Enter your email and the 6-digit OTP"
            });
        }

        const [rows] = await pool.execute(
            `SELECT
                r.id,
                r.user_id,
                r.otp_hash,
                r.expires_at,
                r.attempts
             FROM password_reset_otps r
             INNER JOIN users u ON u.user_id = r.user_id
             INNER JOIN students s ON s.user_id = u.user_id
             WHERE LOWER(s.email) = ?
               AND UPPER(u.role) = 'STUDENT'
               AND r.used_at IS NULL
             ORDER BY r.id DESC
             LIMIT 1`,
            [email]
        );

        const record = rows[0];

        if (!record || record.attempts >= 5) {
            return res.status(400).json({
                success: false,
                message: "OTP is invalid or expired. Request a new OTP."
            });
        }

        if (new Date(record.expires_at).getTime() <= Date.now()) {
            await pool.execute(
                "UPDATE password_reset_otps SET used_at = NOW() WHERE id = ?",
                [record.id]
            );

            return res.status(400).json({
                success: false,
                message: "OTP is invalid or expired. Request a new OTP."
            });
        }

        if (hashOtp(otp) !== record.otp_hash) {
            await pool.execute(
                `UPDATE password_reset_otps
                 SET attempts = attempts + 1
                 WHERE id = ? AND used_at IS NULL`,
                [record.id]
            );

            return res.status(400).json({
                success: false,
                message: "OTP is invalid or expired. Request a new OTP."
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Server configuration error"
            });
        }

        // Consume the OTP only once.
        const [updateResult] = await pool.execute(
            `UPDATE password_reset_otps
             SET used_at = NOW()
             WHERE id = ?
               AND used_at IS NULL
               AND attempts < 5`,
            [record.id]
        );

        if (updateResult.affectedRows !== 1) {
            return res.status(400).json({
                success: false,
                message: "OTP is invalid or has already been used"
            });
        }

        const resetToken = jwt.sign(
            {
                userId: record.user_id,
                purpose: "password_reset"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "10m"
            }
        );

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            resetToken
        });
    } catch (error) {
        console.error(
            "Verify OTP error:",
            error.code || "",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Could not verify OTP"
        });
    }
};

// ============================================================
// POST /api/auth/reset-password
// ============================================================

const resetPassword = async (req, res) => {
    try {
        const resetToken =
            typeof req.body.resetToken === "string"
                ? req.body.resetToken
                : "";

        const newPassword =
            typeof req.body.newPassword === "string"
                ? req.body.newPassword
                : "";

        const confirmPassword =
            typeof req.body.confirmPassword === "string"
                ? req.body.confirmPassword
                : "";

        if (!resetToken || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        const strongPassword =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

        if (!strongPassword.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters and include uppercase, lowercase, number and special character"
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Server configuration error"
            });
        }

        let decoded;

        try {
            decoded = jwt.verify(
                resetToken,
                process.env.JWT_SECRET
            );
        } catch {
            return res.status(400).json({
                success: false,
                message:
                    "Reset session expired. Please request a new OTP."
            });
        }

        if (
            decoded.purpose !== "password_reset" ||
            !decoded.userId
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid password reset session"
            });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        const [result] = await pool.execute(
            "UPDATE users SET password_hash = ? WHERE user_id = ?",
            [passwordHash, decoded.userId]
        );

        if (result.affectedRows !== 1) {
            return res.status(404).json({
                success: false,
                message: "User account not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. Please log in."
        });
    } catch (error) {
        console.error(
            "Reset password error:",
            error.code || "",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Could not reset password"
        });
    }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    login,
    getCurrentUser,
    forgotPassword,
    verifyResetOtp,
    resetPassword
};
