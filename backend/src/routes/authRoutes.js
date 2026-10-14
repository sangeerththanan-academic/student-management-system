const express = require("express");

const {
    login,
    getCurrentUser
} = require("../controllers/authController");

const {
    forgotPassword,
    verifyOtp,
    resetPassword
} = require("../controllers/passwordResetController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

// Existing routes
router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);

// Forgot Password / OTP routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;