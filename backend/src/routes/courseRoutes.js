const express = require("express");
const { getAvailableCourses, getCourse } = require("../controllers/courseController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/courses - Retrieve available courses
// Requires authentication (both students and admins can view courses)
router.get("/", authenticate, getAvailableCourses);

// GET /api/courses/:id - Retrieve specific course by ID
router.get("/:id", authenticate, getCourse);

module.exports = router;
