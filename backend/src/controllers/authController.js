const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const {
    findUserByUsername,
    findUserById,
    findUserByEmail,
    updateLastLogin,
    createPasswordResetOTP,
    findPasswordResetOTP,
    invalidatePasswordResetOTPs,
    incrementPasswordResetOTPAttempts,
    updatePassword,
    markPasswordResetOTPUsed
} = require("../models/userModel");

const createMailTransport = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.");
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });
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

        // CR-006: Update last login after successful password verification
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

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid email address"
            });
        }

        const user = await findUserByEmail(email);

        /*
         * Generic response prevents unnecessary
         * account enumeration.
         */
        if (!user) {
            if (process.env.NODE_ENV !== "production") {
                return res.status(404).json({
                    success: false,
                    message: "No account matches this email. Enter the email saved on the student profile."
                });
            }

            return res.status(200).json({
                success: true,
                message:
                    "If an account exists for this email address, password reset instructions have been sent."
            });
        }

        const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
        const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await invalidatePasswordResetOTPs(user.user_id);
        await createPasswordResetOTP(user.user_id, otpHash, expiresAt);

        try {
            const transporter = createMailTransport();
            await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: user.email,
                subject: "Your password reset code",
                text: `Your password reset code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
                html: `<p>Your password reset code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${otp}</p><p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>`
            });
        } catch (mailError) {
            await invalidatePasswordResetOTPs(user.user_id);
            throw mailError;
        }

        return res.status(200).json({
            success: true,
            message:
                "If an account exists for this email address, a password reset code has been sent."
        });

    } catch (error) {
        console.error("Forgot password email error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to send the password reset code. Check the SMTP settings and try again."
        });
    }
};


// ==========================================
// RESET PASSWORD
// ==========================================

const resetPassword = async (req, res) => {
    try {
        const {
            email: rawEmail,
            otp: rawOtp,
            password,
            confirmPassword
        } = req.body;
        const email = rawEmail?.trim().toLowerCase();
        const otp = rawOtp?.trim();

        if (!email || !/^\d{6}$/.test(otp || "") || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Email, six-digit code, password and password confirmation are required"
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

        const user = await findUserByEmail(email);
        const resetOTP = user
            ? await findPasswordResetOTP(user.user_id)
            : null;

        if (!resetOTP || resetOTP.used_at) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset code"
            });
        }

        if (resetOTP.attempts >= 5) {
            return res.status(400).json({
                success: false,
                message: "Too many incorrect attempts. Request a new code."
            });
        }

        if (new Date(resetOTP.expires_at) <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "This password reset code has expired. Request a new code."
            });
        }

        const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
        const matches = crypto.timingSafeEqual(
            Buffer.from(otpHash, "hex"),
            Buffer.from(resetOTP.otp_hash, "hex")
        );

        if (!matches) {
            await incrementPasswordResetOTPAttempts(resetOTP.id);
            return res.status(400).json({
                success: false,
                message: "Incorrect code. Check the email and try again."
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
            user.user_id,
            passwordHash
        );

        /*
         * Invalidate the token.
         */
        await markPasswordResetOTPUsed(
            resetOTP.id
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
