const nodemailer = require("nodemailer");

const sendPasswordResetOtp = async (email, otp) => {
    const {
        EMAIL_USER,
        EMAIL_PASS,
        EMAIL_FROM,
        EMAIL_PORT,
        SMTP_EMAIL,
        SMTP_PASSWORD
    } = process.env;
    const emailUser = EMAIL_USER || SMTP_EMAIL;
    const emailPass = EMAIL_PASS || SMTP_PASSWORD;

    if (!emailUser || !emailPass) {
        const error = new Error("Password reset email service is not configured");
        error.code = "EMAIL_NOT_CONFIGURED";
        throw error;
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        port: Number(EMAIL_PORT || 465),
        secure: Number(EMAIL_PORT || 465) === 465,
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });

    await transporter.sendMail({
        from: EMAIL_FROM || emailUser,
        to: email,
        subject: "Student Management System password reset OTP",
        text: [
            "Your password reset OTP is:",
            "",
            otp,
            "",
            "This OTP expires in 10 minutes and can only be used once.",
            "If you did not request this, please ignore this email."
        ].join("\n")
    });
};

module.exports = {
    sendPasswordResetOtp
};
