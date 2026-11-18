const express = require("express");

const {
    login,
    getCurrentUser,
    forgotPassword,
    verifyResetToken,
    resetPassword
} = require("../controllers/authController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me
router.get("/me", authenticate, getCurrentUser);

// CR-026: Password reset routes
// POST /api/auth/forgot-password
router.post("/forgot-password", forgotPassword);

// GET /api/auth/verify-reset-token and POST /api/auth/verify-otp
router.get("/verify-reset-token", verifyResetToken);
router.post("/verify-reset-token", verifyResetToken);
router.post("/verify-otp", verifyResetToken);

// POST /api/auth/reset-password
router.post("/reset-password", resetPassword);

module.exports = router;
