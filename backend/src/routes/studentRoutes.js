const express = require("express");

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent,
    changeStudentPassword,
    exportStudentsCsv
} = require("../controllers/studentController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// STUDENT ROUTES

// Get current student's own profile
router.get(
    "/me",
    authenticate,
    getMyProfile
);


// Export students to CSV (CR-015)
// Administrator only
router.get(
    "/export",
    authenticate,
    authorizeRoles("ADMIN"),
    exportStudentsCsv
);

router.get(
    "/export/csv",
    authenticate,
    authorizeRoles("ADMIN"),
    exportStudentsCsv
);


// Create student
// Administrator only
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
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


// Change student password (CR-020)
// Support /me, /change-password, /:id, /:id/password, and root PATCH
router.patch(
    "/me",
    authenticate,
    changeStudentPassword
);

router.patch(
    "/change-password",
    authenticate,
    changeStudentPassword
);

router.patch(
    "/:id/password",
    authenticate,
    changeStudentPassword
);

router.patch(
    "/:id",
    authenticate,
    changeStudentPassword
);

router.patch(
    "/",
    authenticate,
    changeStudentPassword
);


module.exports = router;
