
const express = require("express");

const {
    addStudent,
    getAllStudents,
    getStudentById,
    getMyProfile,
    updateMyProfile,
    editStudent,
    deleteStudent,
    changeStudentPassword,
    importStudents
} = require("../controllers/studentController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================
// STUDENT SELF-SERVICE ROUTES
// ============================================

// Get authenticated student's profile
router.get(
    "/me",
    authenticate,
    authorizeRoles("STUDENT"),
    getMyProfile
);

// CR-019: Update authenticated student's own profile
router.put(
    "/me",
    authenticate,
    authorizeRoles("STUDENT"),
    updateMyProfile
);

// CR-020: Change authenticated student's password
router.patch(
    "/me/password",
    authenticate,
    authorizeRoles("STUDENT"),
    changeStudentPassword
);

// ============================================
// ADMIN-ONLY ROUTES
// ============================================

// CR-015: Import multiple student records from CSV.
// Keep this route before "/:id".
router.post(
    "/import-csv",
    authenticate,
    authorizeRoles("ADMIN"),
    importStudents
);

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
    getAllStudents
);

// Get student by ID
router.get(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudentById
);

// Existing ADMIN-only student update
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
    deleteStudent
);

module.exports = router;
