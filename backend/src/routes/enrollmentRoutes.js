const express = require("express");
const { enrollStudent, getMyEnrollments } = require("../controllers/enrollmentController");
const { authenticate, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// SEC-001 & SEC-002: Enforce authentication and STUDENT role
// POST /api/enrollments - Enroll authenticated student in a selected course
router.post("/", authenticate, authorizeRoles("STUDENT"), enrollStudent);

// GET /api/enrollments/my - Get authenticated student's enrolled courses
router.get("/my", authenticate, authorizeRoles("STUDENT"), getMyEnrollments);

module.exports = router;
