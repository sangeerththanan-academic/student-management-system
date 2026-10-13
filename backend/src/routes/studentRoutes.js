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

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const uploadStudentImage =
    require("../middleware/studentUploadMiddleware");

// GET /api/students/me
router.get("/me", authenticate, getMyProfile);

router.put(
    "/change-password",
    authenticate,
    authorizeRoles("STUDENT"),
    changeStudentPassword
);

// GET /api/students
router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudents
);

// GET /api/students/:id
router.get(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudent
);

// POST /api/students
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadStudentImage,
    addStudent
);

// PUT /api/students/:id
router.put(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadStudentImage,
    editStudent
);

// DELETE /api/students/:id
router.delete(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    removeStudent
);

module.exports = router;