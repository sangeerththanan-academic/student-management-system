
const express = require("express");

const {
    login,
    getCurrentUser,
    forgotPassword,
    verifyResetOtp,
    resetPassword
} = require("../controllers/authController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
