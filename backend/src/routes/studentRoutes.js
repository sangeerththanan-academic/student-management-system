// const express = require("express");

// const {
//     addStudent,
//     getStudents,
//     getStudent,
//     getMyProfile,
//     editStudent,
//     removeStudent
// } = require("../controllers/studentController");

// const {
//     authenticate,
//     authorizeRoles
// } = require("../middleware/authMiddleware");

// const router = express.Router();


// // STUDENT ROUTES

// // Get current student's own profile
// router.get(
//     "/me",
//     authenticate,
//     getMyProfile
// );


// // Create student
// // Administrator only
// router.post(
//     "/",
//     authenticate,
//     authorizeRoles("ADMIN"),
//     addStudent
// );


// // Get all students
// // Administrator only
// router.get(
//     "/",
//     authenticate,
//     authorizeRoles("ADMIN"),
//     getStudents
// );


// // Get student by ID
// // Administrator only
// router.get(
//     "/:id",
//     authenticate,
//     authorizeRoles("ADMIN"),
//     getStudent
// );


// // Update student
// // Administrator only
// router.put(
//     "/:id",
//     authenticate,
//     authorizeRoles("ADMIN"),
//     editStudent
// );


// // Delete student
// // Administrator only
// router.delete(
//     "/:id",
//     authenticate,
//     authorizeRoles("ADMIN"),
//     removeStudent
// );


// module.exports = router;



const express = require("express");

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    updateMyProfileController,
    editStudent,
    removeStudent
} = require("../controllers/studentController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


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

// Update current student's own profile
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
