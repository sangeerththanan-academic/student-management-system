const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendOtpEmail(email, otp) {
    if (
        !process.env.SMTP_HOST ||
        !process.env.SMTP_USER ||
        !process.env.SMTP_PASS
    ) {
        const error = new Error("SMTP configuration is incomplete");
        error.code = "SMTP_CONFIG";
        throw error;
    }

    return transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: "Student Management System - Password Reset OTP",
        text: `Your password reset OTP is ${otp}. It expires in ${
            process.env.OTP_EXPIRY_MINUTES || 10
        } minutes. If you did not request this, ignore this email.`
    });
}

module.exports = { sendOtpEmail };