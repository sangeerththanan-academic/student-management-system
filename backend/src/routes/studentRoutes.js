const express = require("express");

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    updateMyProfileImage,
    removeMyProfileImage,
    editStudent,
    removeStudent
} = require("../controllers/studentController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");
const uploadProfileImage = require("../middleware/profileImageUpload");

const router = express.Router();


// STUDENT ROUTES

// Get current student's own profile
router.get(
    "/me",
    authenticate,
    getMyProfile
);

router.put(
    "/me/profile-image",
    authenticate,
    authorizeRoles("STUDENT"),
    uploadProfileImage,
    updateMyProfileImage
);

router.delete(
    "/me/profile-image",
    authenticate,
    authorizeRoles("STUDENT"),
    removeMyProfileImage
);


// Create student
// Administrator only
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
