require("dotenv").config();
const nodemailer = require("nodemailer");

/**
 * Creates and returns an authenticated Nodemailer SMTP transporter.
 * Supports:
 * 1. Standard Generic SMTP Server (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE)
 * 2. Predefined Service (EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS)
 */
const getSmtpTransporter = () => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const rawPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const smtpPass = rawPass ? rawPass.trim().replace(/\s+/g, "") : "";
    const emailService = process.env.EMAIL_SERVICE;

    // Check if standard SMTP host or service is provided
    if (smtpHost && smtpUser && smtpPass) {
        return nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
                user: smtpUser,
                pass: smtpPass
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    // Support preset service (e.g., service: 'gmail' connects to smtp.gmail.com:465)
    if (emailService && smtpUser && smtpPass) {
        return nodemailer.createTransport({
            service: emailService,
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });
    }

    throw new Error(
        "SMTP email configuration is missing in backend/.env. Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS (or EMAIL_SERVICE, EMAIL_USER, and EMAIL_PASS)."
    );
};

/**
 * Send password reset email strictly via SMTP server.
 * No localhost or console fallbacks.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} token - 64-character crypto token
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
/**
 * Send password reset OTP email strictly via SMTP server.
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit verification code
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
const sendPasswordResetEmail = async (toEmail, otp) => {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || "no-reply@studentmanagement.com";

    const transporter = getSmtpTransporter();

    const mailOptions = {
        from: fromAddress.includes("<") ? fromAddress : `"Student Management System" <${fromAddress}>`,
        to: toEmail,
        subject: `${otp} is your Password Reset Verification Code - Student Management System`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; text-align: center;">
                <h2 style="color: #1e293b; margin-top: 0; margin-bottom: 8px;">Student Management System</h2>
                <h3 style="color: #2563eb; margin-top: 0; font-size: 18px; font-weight: 600;">Password Reset Verification Code</h3>
                <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 20px 0 12px;">
                    We received a request to reset your password for <strong>${toEmail}</strong>.
                </p>
                <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">
                    Enter the following 6-digit One-Time Password (OTP) in the system to verify your identity:
                </p>
                <div style="margin: 24px auto; padding: 16px 32px; background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 10px; display: inline-block;">
                    <span style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #1d4ed8; font-family: monospace;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 16px;">
                    This code is valid for <strong>15 minutes</strong>. Do not share this code with anyone.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 20px;" />
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    If you did not request a password reset, please disregard this email. Your current password remains secure.
                </p>
            </div>
        `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Reset OTP (${otp}) sent to ${toEmail} | Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId, otp };
};

module.exports = {
    sendPasswordResetEmail,
    getSmtpTransporter
};

