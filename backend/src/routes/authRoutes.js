const express = require("express");

const {
    login,
    getCurrentUser,
    forgotPassword,
    verifyResetOtp,
    resetPassword
} = require("../controllers/authController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

// Login
router.post("/login", login);

// Current logged-in user
router.get("/me", authenticate, getCurrentUser);

// CR-026: Request email OTP
router.post("/forgot-password", forgotPassword);

// CR-026: Verify email OTP
router.post("/verify-reset-otp", verifyResetOtp);

// CR-026: Reset password after OTP verification
router.post("/reset-password", resetPassword);

module.exports = router;