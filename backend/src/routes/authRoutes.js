const express = require("express");

const {
    login,
    getCurrentUser,
    changePassword,
    requestStudentPasswordReset,
    verifyStudentPasswordResetOtp,
    resetStudentPassword
} = require("../controllers/authController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me
router.get("/me", authenticate, getCurrentUser);

// POST /api/auth/change-password
router.post("/change-password", authenticate, changePassword);

// Student-only password reset
router.post("/student/forgot-password", requestStudentPasswordReset);
router.post("/student/verify-reset-otp", verifyStudentPasswordResetOtp);
router.post("/student/reset-password", resetStudentPassword);

module.exports = router;
