const express = require("express");
const router = express.Router();

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent
} = require("../controllers/studentController");

const { authenticate } = require("../middleware/authMiddleware");

const uploadStudentImage = require("../middleware/studentUploadMiddleware");

router.get("/me", authenticate, getMyProfile);
router.get("/", authenticate, getStudents);
router.get("/:id", authenticate, getStudent);

router.post(
    "/",
    authenticate,
    uploadStudentImage.single("profileImage"),
    addStudent
);

router.put(
    "/:id",
    authenticate,
    uploadStudentImage.single("profileImage"),
    editStudent
);

router.delete("/:id", authenticate, removeStudent);

module.exports = router;