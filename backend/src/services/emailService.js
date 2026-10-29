const nodemailer = require("nodemailer");

// Load email settings from backend/.env
const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../../.env")
});

// Create Gmail SMTP transporter
const createTransporter = () => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
        throw new Error(
            "EMAIL_USER and EMAIL_PASS must be configured in backend/.env"
        );
    }

    const port = Number(process.env.EMAIL_PORT || 587);

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port,
        secure: port === 465,
        auth: {
            user: emailUser,
            pass: emailPass.replace(/\s+/g, "")
        }
    });
};

// Verify Gmail SMTP connection
const verifyEmailConnection = async () => {
    try {
        const transporter = createTransporter();

        await transporter.verify();

        console.log("Gmail SMTP connection successful");

        return true;
    } catch (error) {
        console.error(
            "Gmail SMTP connection failed:",
            error.message
        );

        return false;
    }
};

// Send Student Login OTP
const sendStudentLoginOtpEmail = async (email, otp) => {
    if (!email || !otp) {
        throw new Error("Recipient email and OTP are required");
    }

    const transporter = createTransporter();

    return transporter.sendMail({
        from: `"ABC Institute" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Student Login Verification Code",
        text:
            `Your ABC Institute Student Login OTP is ${otp}.\n\n` +
            "This code expires in 10 minutes.\n" +
            "Do not share this code with anyone.\n\n" +
            "If you did not request this code, ignore this email.",
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 24px;
                color: #1f2937;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
            ">
                <h2 style="color: #2563eb;">ABC Institute</h2>
                <h3>Student Login Verification</h3>

                <p>
                    Use the verification code below to log in
                    to your Student account.
                </p>

                <div style="
                    margin: 24px 0;
                    padding: 20px;
                    text-align: center;
                    background: #eff6ff;
                    border-radius: 8px;
                ">
                    <span style="
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 8px;
                        color: #1d4ed8;
                    ">${otp}</span>
                </div>

                <p>
                    This OTP expires in
                    <strong>10 minutes</strong>.
                </p>

                <p>Do not share this code with anyone.</p>

                <p style="color: #6b7280; font-size: 13px;">
                    If you did not request this code, ignore this email.
                </p>
            </div>
        `
    });
};

// Send Password Reset Email
const sendPasswordResetEmail = async (email, resetLink) => {
    if (!email || !resetLink) {
        throw new Error("Recipient email and reset link are required");
    }

    const transporter = createTransporter();

    return transporter.sendMail({
        from: `"ABC Institute" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Reset - ABC Institute",
        text:
            "A password reset was requested for your account.\n\n" +
            `Reset your password using this link: ${resetLink}\n\n` +
            "If you did not request this, ignore this email.",
        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 24px;
                color: #1f2937;
            ">
                <h2>ABC Institute</h2>
                <h3>Password Reset</h3>

                <p>
                    Click below to reset your password.
                    This link should only be used by you.
                </p>

                <p>
                    <a href="${resetLink}" style="
                        display: inline-block;
                        padding: 12px 20px;
                        background: #2563eb;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 6px;
                    ">
                        Reset Password
                    </a>
                </p>

                <p>
                    If you did not request this, ignore this email.
                </p>
            </div>
        `
    });
};

// Send Password Changed Notification
const sendPasswordChangedEmail = async (email) => {
    if (!email) {
        throw new Error("Recipient email is required");
    }

    const transporter = createTransporter();

    return transporter.sendMail({
        from: `"ABC Institute" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Changed - ABC Institute",
        text:
            "Your ABC Institute account password has been changed successfully.\n\n" +
            "If you did not make this change, contact your administrator."
    });
};

module.exports = {
    sendStudentLoginOtpEmail,
    sendPasswordResetEmail,
    sendPasswordChangedEmail,
    verifyEmailConnection
};
