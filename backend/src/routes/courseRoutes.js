const express = require("express");

const {
    addCourse,
    getCourses,
    getCourse
} = require("../controllers/courseController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// COURSE ROUTES (CR06)

// Create course
// Administrator only
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    addCourse
);


// Get all courses
// Administrator only
router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    getCourses
);


// Get course by ID
// Administrator only
router.get(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    getCourse
);


module.exports = router;

