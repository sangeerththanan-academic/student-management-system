
const express = require("express");

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent,
    changeMyPassword
} = require("../controllers/studentController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const {
    uploadStudentProfileImage
} = require("../middleware/uploadMiddleware");

const router = express.Router();

// Student's own profile
router.get(
    "/me",
    authenticate,
    authorizeRoles("STUDENT"),
    getMyProfile
);

// CR-020: Change own password
router.patch(
    "/:id/password",
    authenticate,
    authorizeRoles("STUDENT"),
    changeMyPassword
);

// Create student — Admin only
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadStudentProfileImage,
    addStudent
);

// Get all students — Admin only
router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudents
);

// Get student by ID — Admin only
router.get(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudent
);

// Update student — Admin only
router.put(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadStudentProfileImage,
    editStudent
);

// Delete student — Admin only
router.delete(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    removeStudent
);

module.exports = router;
