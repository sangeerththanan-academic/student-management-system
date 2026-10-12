
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

// CR-010: Student profile image upload middleware
const uploadProfileImage = require("../middleware/uploadMiddleware");

const router = express.Router();


// STUDENT ROUTES

// Get current student's own profile
router.get(
    "/me",
    authenticate,
    getMyProfile
);


// Create student
// Administrator only
// CR-010: Allow optional profile image upload
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadProfileImage,
    addStudent
);


// Get all students
// Administrator only
router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudents
);


// Get student by ID
// Administrator only
router.get(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudent
);


// Update student
// Administrator only
// CR-010: Allow optional profile image update
router.put(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadProfileImage,
    editStudent
);


// Delete student
// Administrator only
router.delete(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    removeStudent
);


module.exports = router;
