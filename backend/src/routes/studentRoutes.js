
const express = require("express");

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent,
    changeMyPassword,
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

router.get(
    "/me",
    authenticate,
    authorizeRoles("STUDENT"),
    getMyProfile
);



router.patch(
    "/me/password",
    authenticate,
    authorizeRoles("STUDENT"),
    changeMyPassword
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
    getStudents
);

// Get student by ID
router.get(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudent
);

// Update student profile
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
