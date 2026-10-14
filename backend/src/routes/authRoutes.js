
const express = require("express");

const {
    login,
    getCurrentUser
} = require("../controllers/authController");

const {
    forgotPassword,
    resetPassword
} = require("../controllers/passwordResetController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

// Existing login and authentication routes
router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);

// OTP-based password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
