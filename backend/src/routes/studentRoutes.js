const express = require("express");

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    changeMyPassword,
    updateMyProfile,
    editStudent,
    removeStudent
} = require("../controllers/studentController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();
const { uploadStudentImage } = require("../middleware/studentImageUpload");


// STUDENT ROUTES

// Get current student's own profile
router.get(
    "/me",
    authenticate,
    getMyProfile
);

router.put(
    "/me",
    authenticate,
    authorizeRoles("STUDENT"),
    updateMyProfile
);


// Change the authenticated student's own password.
// The controller verifies that :id matches req.user.userId.
router.patch(
    "/:id",
    authenticate,
    authorizeRoles("STUDENT"),
    changeMyPassword
);


// Create student
// Administrator only
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadStudentImage,
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
