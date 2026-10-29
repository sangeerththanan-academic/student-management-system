
const express = require("express");

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    updateMyProfile,
    editStudent,
    removeStudent,
    changeMyPassword,
    bulkImportStudents
} = require("../controllers/studentController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const { uploadStudentImage } = require("../middleware/studentUploadMiddleware");

const router = express.Router();

// Get current student's own profile
router.get(
    "/me",
    authenticate,
    getMyProfile
);

// CR-019: Students can update only their own email address and phone number.
router.put(
    "/me",
    authenticate,
    authorizeRoles("STUDENT"),
    updateMyProfile
);


// Create student - Administrator only
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadStudentImage.single("profileImage"),
    addStudent
);

// Get all students - Administrator only
router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudents
);

// Get student by ID - Administrator only
router.get(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudent
);

// Update student - Administrator only
router.put(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadStudentImage.single("profileImage"),
    editStudent
);

// Delete student - Administrator only
router.delete(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    removeStudent
);


router.post(
    "/bulk-import",
    authenticate,
    authorizeRoles("ADMIN"),
    bulkImportStudents
);


module.exports = router;