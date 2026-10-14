
const express = require("express");

const {
    login,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    requestStudentLoginOtp,
    verifyStudentLoginOtp
} = require("../controllers/authController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

// Existing login for Admin and other supported roles.
router.post("/login", login);

// Get the currently authenticated user.
router.get("/me", authenticate, getCurrentUser);

// Student login using email OTP.
router.post(
    "/student/request-login-otp",
    requestStudentLoginOtp
);

router.post(
    "/student/verify-login-otp",
    verifyStudentLoginOtp
);

// Existing password reset routes.
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
