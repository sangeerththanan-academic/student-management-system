
const express = require("express");
const router = express.Router();

const {
    addStudent,
    getStudents,
    exportStudentsCsv,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent,
    changeStudentPassword
} = require("../controllers/studentController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const uploadStudentImage =
    require("../middleware/studentUploadMiddleware");

// Get logged-in student's profile
router.get("/me", authenticate, getMyProfile);

// Change student password
router.put(
    "/change-password",
    authenticate,
    authorizeRoles("STUDENT"),
    changeStudentPassword
);

// Get all students
router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudents
);

// CR-015: Export student records to CSV
// IMPORTANT: Keep this before /:id
router.get(
    "/export/csv",
    authenticate,
    authorizeRoles("ADMIN"),
    exportStudentsCsv
);

// Get student by ID
router.get(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudent
);

// Add student
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadStudentImage,
    addStudent
);

// Update student
router.put(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadStudentImage,
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
