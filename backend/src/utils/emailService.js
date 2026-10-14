const nodemailer = require("nodemailer");

/**
 * Configure Nodemailer SMTP Transporter
 * Using Gmail SMTP with Google App Password over SSL (Port 465)
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== "false", // true for 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Reasonable timeouts so requests don't hang indefinitely
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
});

/**
 * Send OTP verification email for password reset
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit numeric OTP
 * @returns {Promise<boolean>}
 */
const sendOTPEmail = async (toEmail, otp) => {
    const mailOptions = {
        from: `"ABC Institute - Student Management System" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Password Reset Verification Code (OTP)",
        text: `Your One-Time Password (OTP) for password reset is:

${otp}

This OTP will expire in 10 minutes. If you did not request this password reset, please ignore this email.

For your security, please do not share this OTP with anyone.`,
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #1d4ed8, #2563eb); padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">ABC Institute</h1>
                <p style="color: #dbeafe; margin: 8px 0 0 0; font-size: 14px;">Student Management System</p>
            </div>
            <div style="padding: 32px 24px;">
                <h2 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">Password Reset Request</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                    We received a request to reset your password. Use the verification code (OTP) below to proceed with resetting your password:
                </p>
                <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1d4ed8; display: inline-block;">${otp}</span>
                </div>
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
                    <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
                        <strong>Note:</strong> This OTP is valid for <strong>10 minutes</strong> only and can be used once. You have a maximum of 3 attempts.
                    </p>
                </div>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">
                    If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    For your security, never share this OTP with anyone, including institute administrators.
                </p>
            </div>
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    &copy; ${new Date().getFullYear()} ABC Institute. All rights reserved.
                </p>
            </div>
        </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] OTP email sent to ${toEmail}: messageId=${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[EmailService] Failed to send email to ${toEmail}:`, error.message);
        throw error;
    }
};

module.exports = {
    transporter,
    sendOTPEmail
};
