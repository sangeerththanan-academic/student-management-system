
const express = require("express");

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent
} = require("../controllers/studentController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const uploadProfileImage = require("../middleware/uploadMiddleware");

const router = express.Router();

// Get current student's own profile
router.get("/me", authenticate, getMyProfile);

// Create student with optional profile image
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadProfileImage,
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
