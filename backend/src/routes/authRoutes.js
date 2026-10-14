const express = require("express");

const {
    login,
    getCurrentUser,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);

// Public endpoints for email OTP password recovery.
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;