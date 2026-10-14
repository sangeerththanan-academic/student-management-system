const express = require("express");

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    changeMyPassword,
    editStudent,
    removeStudent
} = require("../controllers/studentController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const {
    uploadStudentPhoto
} = require("../middleware/uploadMiddleware");

const router = express.Router();


// STUDENT ROUTES

// Get current student's own profile
router.get(
    "/me",
    authenticate,
    getMyProfile
);


// Change own password (CR-020)
// Student must be logged in; no ADMIN role required
router.put(
    "/me/change-password",
    authenticate,
    changeMyPassword
);


// Create student
// Administrator only (CR-010: supports profile photo upload)
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadStudentPhoto,
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
router.put(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
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
