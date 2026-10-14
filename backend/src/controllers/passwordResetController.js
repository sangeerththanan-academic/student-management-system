const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const {
    findStudentByEmail,
    isRecentlySent,
    saveOtp,
    deleteOtp,
    findActiveOtp,
    increaseOtpAttempts,
    updatePasswordAndDeleteToken
} = require("../models/passwordResetModel");

const { sendOtpEmail } = require("../services/smtpService");

// Hash OTP before storing it
const hashValue = (value) =>
    crypto.createHash("sha256").update(value).digest("hex");

// Compare hashes safely
const safeCompare = (first, second) => {
    if (
        typeof first !== "string" ||
        typeof second !== "string" ||
        !/^[a-f0-9]{64}$/i.test(first) ||
        !/^[a-f0-9]{64}$/i.test(second)
    ) {
        return false;
    }

    const a = Buffer.from(first, "hex");
    const b = Buffer.from(second, "hex");

    return crypto.timingSafeEqual(a, b);
};

const validEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);


// STEP 1: Send OTP to email
const forgotPassword = async (req, res) => {
    try {
        const email =
            typeof req.body.email === "string"
                ? req.body.email.trim()
                : "";

        if (!validEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        const student = await findStudentByEmail(email);

        if (!student) {
            return res.status(200).json({
                success: true,
                message:
                    "If this email belongs to a student account, an OTP will be sent."
            });
        }

        if (await isRecentlySent(student.user_id)) {
            return res.status(429).json({
                success: false,
                message: "Please wait one minute before requesting another OTP."
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = hashValue(otp);

        await saveOtp(student.user_id, otpHash);

        try {
            await sendOtpEmail(student.email, otp);
        } catch (emailError) {
            console.error("OTP email error:", emailError.message);
            await deleteOtp(student.user_id);

            return res.status(500).json({
                success: false,
                message: "Unable to send OTP. Please try again later."
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully if the email is registered."
        });

    } catch (error) {
        console.error("Forgot password error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


// STEP 2: Verify OTP
const verifyOtp = async (req, res) => {
    try {
        const email =
            typeof req.body.email === "string"
                ? req.body.email.trim()
                : "";

        const otp =
            typeof req.body.otp === "string"
                ? req.body.otp.trim()
                : "";

        if (!validEmail(email) || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid email and six-digit OTP."
            });
        }

        const student = await findStudentByEmail(email);

        if (!student) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP."
            });
        }

        const record = await findActiveOtp(student.user_id);

        if (!record) {
            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new OTP."
            });
        }

        if (!safeCompare(hashValue(otp), record.otp_hash)) {
            await increaseOtpAttempts(student.user_id);

            const updatedRecord =
                await findActiveOtp(student.user_id);

            if (!updatedRecord) {
                await deleteOtp(student.user_id);
            }

            return res.status(400).json({
                success: false,
                message: "Incorrect OTP. Please try again."
            });
        }

        // No reset token is created.
        // OTP is checked again when the password is changed.
        return res.status(200).json({
            success: true,
            message: "OTP verified successfully."
        });

    } catch (error) {
        console.error("Verify OTP error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


// STEP 3: Reset password using email and OTP
const resetPassword = async (req, res) => {
    try {
        const email =
            typeof req.body.email === "string"
                ? req.body.email.trim()
                : "";

        const otp =
            typeof req.body.otp === "string"
                ? req.body.otp.trim()
                : "";

        const newPassword =
            typeof req.body.newPassword === "string"
                ? req.body.newPassword
                : "";

        const confirmPassword =
            typeof req.body.confirmPassword === "string"
                ? req.body.confirmPassword
                : "";

        // Validate required fields
        if (
            !validEmail(email) ||
            !/^\d{6}$/.test(otp) ||
            !newPassword ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP, new password and confirm password are required."
            });
        }

        // Check whether passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match."
            });
        }

        // Validate password length
        if (
            newPassword.length < 8 ||
            newPassword.length > 72
        ) {
            return res.status(400).json({
                success: false,
                message: "Password must be 8 to 72 characters long."
            });
        }

        // Find student
        const student = await findStudentByEmail(email);

        if (!student) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP."
            });
        }

        // Find active OTP
        const record = await findActiveOtp(student.user_id);

        if (!record) {
            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new OTP."
            });
        }

        // Verify OTP again before changing the password
        if (!safeCompare(hashValue(otp), record.otp_hash)) {
            await increaseOtpAttempts(student.user_id);

            const updatedRecord =
                await findActiveOtp(student.user_id);

            if (!updatedRecord) {
                await deleteOtp(student.user_id);
            }

            return res.status(400).json({
                success: false,
                message: "Incorrect OTP. Please verify your OTP again."
            });
        }

        // Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, 12);

        // Update the student's password
        await updatePasswordAndDeleteToken(
            student.user_id,
            passwordHash
        );

        // Delete OTP so it cannot be reused
        await deleteOtp(student.user_id);

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now log in."
        });

    } catch (error) {
        console.error("Reset password error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};


module.exports = {
    forgotPassword,
    verifyOtp,
    resetPassword
};