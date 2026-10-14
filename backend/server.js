const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const app = require("./src/app");

const PORT = process.env.PORT || 5000;

if (!process.env.EMAIL_USER && !process.env.SMTP_EMAIL) {
    console.warn(
        "Password reset email is not configured. Add EMAIL_USER/EMAIL_PASS " +
        "or SMTP_EMAIL/SMTP_PASSWORD to backend/.env."
    );
}

app.listen(PORT, () => {
    console.log(`Student Management System API is running on port ${PORT}`);
});
