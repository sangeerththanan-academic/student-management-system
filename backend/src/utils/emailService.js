const nodemailer = require("nodemailer");

const sendPasswordResetOtpEmail = async (email, otp) => {
    const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_SECURE,
        SMTP_USER,
        SMTP_PASS,
        SMTP_FROM
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        throw new Error("SMTP configuration is incomplete");
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: String(SMTP_SECURE).toLowerCase() === "true",
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });

    await transporter.sendMail({
        from: SMTP_FROM || SMTP_USER,
        to: email,
        subject: "Student Management System - Password Reset OTP",
        text:
            `Your password reset OTP is ${otp}.\n\n` +
            "This OTP expires in 10 minutes and can only be used once. " +
            "If you did not request a password reset, you can ignore this email.",
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
                <h2>Password Reset Request</h2>
                <p>Use the following one-time password to reset your Student Management System account password:</p>
                <p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p>
                <p>This OTP expires in <strong>10 minutes</strong> and can only be used once.</p>
                <p>If you did not request a password reset, you can ignore this email.</p>
            </div>
        `
    });
};

module.exports = {
    sendPasswordResetOtpEmail
};