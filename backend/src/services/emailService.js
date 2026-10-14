
const nodemailer = require("nodemailer");

// ==========================================
// SMTP TRANSPORTER
// ==========================================

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",

    port: Number(process.env.SMTP_PORT || 587),

    secure: Number(process.env.SMTP_PORT || 587) === 465,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});


// ==========================================
// SEND PASSWORD RESET OTP EMAIL
// ==========================================

async function sendPasswordOtpEmail(email, otp) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error(
            "SMTP credentials are not configured"
        );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("A valid recipient email is required");
    }

    if (!/^\d{6}$/.test(String(otp))) {
        throw new Error("OTP must contain exactly 6 digits");
    }

    const expiryMinutes = Number(
        process.env.PASSWORD_OTP_EXPIRY_MINUTES || 5
    );

    if (
        !Number.isInteger(expiryMinutes) ||
        expiryMinutes < 1
    ) {
        throw new Error(
            "PASSWORD_OTP_EXPIRY_MINUTES must be a positive integer"
        );
    }

    const mailOptions = {
        from:
            process.env.SMTP_FROM ||
            process.env.SMTP_USER,

        to: email,

        subject:
            "Student Management System - Password Reset OTP",

        text: [
            "Hello,",
            "",
            "We received a request to reset your Student Management System password.",
            "",
            `Your OTP is: ${otp}`,
            "",
            `This OTP expires in ${expiryMinutes} minutes.`,
            "",
            "Do not share this OTP with anyone.",
            "",
            "If you did not request a password reset, you can ignore this email.",
            "",
            "Student Management System"
        ].join("\n"),

        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 520px;
                margin: 20px auto;
                padding: 24px;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                color: #1f2937;
            ">
                <h2 style="text-align:center;">
                    Student Management System
                </h2>

                <h3>Password Reset Verification</h3>

                <p>
                    We received a request to reset your password.
                    Enter the following OTP on the password reset page.
                </p>

                <div style="
                    margin: 24px 0;
                    padding: 20px;
                    background: #f3f4f6;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                ">
                    ${otp}
                </div>

                <p>
                    This OTP expires in
                    <strong>${expiryMinutes} minutes</strong>.
                </p>

                <p>
                    For your security, do not share this OTP with anyone.
                </p>

                <p>
                    If you did not request a password reset,
                    please ignore this email.
                </p>

                <hr style="border:0;border-top:1px solid #e5e7eb;">

                <p style="
                    text-align:center;
                    color:#6b7280;
                    font-size:12px;
                ">
                    Student Management System
                </p>
            </div>
        `
    };

    const result = await transporter.sendMail(mailOptions);

    return result;
}


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    sendPasswordOtpEmail
};
