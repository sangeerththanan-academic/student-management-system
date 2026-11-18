const express = require("express");

const {
    login,
    getCurrentUser,
    changePassword
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

module.exports = router;
