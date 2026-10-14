const express = require("express");

const {
    login,
    getCurrentUser,
    forgotPassword,
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


// POST /api/auth/forgot-password
router.post("/forgot-password", forgotPassword);


// POST /api/auth/reset-password
router.post("/reset-password", resetPassword);


module.exports = router;
