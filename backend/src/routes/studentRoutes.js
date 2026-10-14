
const express = require("express");
const router = express.Router();

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent,
    changeStudentPassword
} = require("../controllers/studentController");

const { authenticate } = require("../middleware/authMiddleware");

const uploadStudentImage =
    require("../middleware/studentUploadMiddleware");

// GET CURRENT STUDENT'S PROFILE
// GET /api/students/me
router.get("/me", authenticate, getMyProfile);

// CHANGE STUDENT PASSWORD
// POST /api/students/change-password
router.post(
    "/change-password",
    authenticate,
    changeStudentPassword
);

// GET ALL STUDENTS
// GET /api/students
router.get("/", authenticate, getStudents);

// GET STUDENT BY ID
// GET /api/students/:id
router.get("/:id", authenticate, getStudent);

// CREATE STUDENT
// POST /api/students
router.post(
    "/",
    authenticate,
    uploadStudentImage.single("profileImage"),
    addStudent
);

// UPDATE STUDENT
// PUT /api/students/:id
router.put(
    "/:id",
    authenticate,
    uploadStudentImage.single("profileImage"),
    editStudent
);

// DELETE STUDENT
// DELETE /api/students/:id
router.delete("/:id", authenticate, removeStudent);

module.exports = router;
