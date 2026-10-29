const express = require("express");
const router = express.Router();

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    updateMyProfileController,
    editStudent,
    removeStudent,
    changeMyPassword,
    importStudents
} = require("../controllers/studentController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const uploadStudentImage = require("../middleware/studentUploadMiddleware");

// ==========================================
// STUDENT ROUTES
// ==========================================

// Get current student's own profile
router.get(
    "/me",
    authenticate,
    authorizeRoles("STUDENT"),
    getMyProfile
);

// Update current student's own email and phone
router.put(
    "/me",
    authenticate,
    authorizeRoles("STUDENT"),
    updateMyProfileController
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Create student - ADMIN only
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadStudentImage.single("profileImage"),
    addStudent
);

// Get all students - ADMIN only
router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudents
);

// Get student by ID - ADMIN only
router.get(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudent
);

// Update student by ID - ADMIN only
router.put(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadStudentImage.single("profileImage"),
    editStudent
);

// Delete student - ADMIN only
router.delete(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    removeStudent
);

module.exports = router;