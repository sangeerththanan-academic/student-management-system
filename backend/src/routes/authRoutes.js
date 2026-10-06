const express = require("express");

const {
    login,
    getCurrentUser
} = require("../controllers/authController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me
router.get("/me", authenticate, getCurrentUser);

module.exports = router;
