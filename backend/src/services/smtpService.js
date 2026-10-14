const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
    }
});

const sendOtpEmail = async (toEmail, otp) => {
    console.log('mail....5');
    console.log('otp:', otp);
    console.log('toEmail:', toEmail);
    await transporter.sendMail({
        from: `"Student Management System" <${process.env.SMTP_EMAIL}>`,
        to: toEmail,
        subject: "Password Reset OTP",
        text: `Your password reset OTP is ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
                <h2>Password Reset</h2>
                <p>Your one-time password (OTP) is:</p>
                <h1 style="letter-spacing: 6px;">${otp}</h1>
                <p>This code expires in <strong>10 minutes</strong>.</p>
                <p>If you did not request a password reset, please ignore this email.</p>
            </div>
        `
    });
};

module.exports = { sendOtpEmail };