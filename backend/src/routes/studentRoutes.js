const express = require("express");

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
    editStudent,
    removeStudent,
    exportStudentsCsv,
    bulkAddStudents
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


// Update current student's own profile (CR-019)
// Student must be logged in; self-update identified by JWT userId
router.put(
    "/me",
    authenticate,
    updateMyProfile
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


// Bulk import students (CR-022)
// Administrator only
router.post(
    "/bulk",
    authenticate,
    authorizeRoles("ADMIN"),
    bulkAddStudents
);

router.post(
    "/import",
    authenticate,
    authorizeRoles("ADMIN"),
    bulkAddStudents
);



// Get all students
// Administrator only
router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudents
);


// Export all students to CSV (CR-015)
// Administrator only
router.get(
    "/export/csv",
    authenticate,
    authorizeRoles("ADMIN"),
    exportStudentsCsv
);

router.get(
    "/export",
    authenticate,
    authorizeRoles("ADMIN"),
    exportStudentsCsv
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
