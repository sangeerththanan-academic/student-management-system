const express = require("express");
const router = express.Router();

const {
    addCourse,
    getCourses
} = require("../controllers/courseController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

// =====================================================
// CR06: COURSE MANAGEMENT ROUTES
// =====================================================

// Add course - Admin only
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    addCourse
);

// Get all courses - Admin only
router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    getCourses
);

module.exports = router;