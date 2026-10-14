const express = require("express");

const {
    login,
    getCurrentUser,
    requestPasswordReset,
    verifyPasswordResetOtpRequest,
    resetPassword
} = require("../controllers/authController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/forgot-password
router.post("/forgot-password", requestPasswordReset);

// POST /api/auth/verify-reset-otp
router.post("/verify-reset-otp", verifyPasswordResetOtpRequest);

// POST /api/auth/reset-password
router.post("/reset-password", resetPassword);

// GET /api/auth/me
router.get("/me", authenticate, getCurrentUser);

module.exports = router;
