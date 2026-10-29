
const express = require("express");

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    updateMyProfile,
    editStudent,
    removeStudent
} = require("../controllers/studentController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// CURRENT STUDENT PROFILE
// =====================================================

// Get current student's own profile
router.get(
    "/me",
    authenticate,
    authorizeRoles("STUDENT"),
    getMyProfile
);

// Update current student's own profile
router.put(
    "/me",
    authenticate,
    authorizeRoles("STUDENT"),
    updateMyProfile
);

// =====================================================
// ADMIN STUDENT MANAGEMENT
// =====================================================

// Create student
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    addStudent
);

// Get all students
router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudents
);

// Get student by ID
router.get(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudent
);

// Update student
router.put(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    editStudent
);

// Delete student
router.delete(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    removeStudent
);

module.exports = router;
