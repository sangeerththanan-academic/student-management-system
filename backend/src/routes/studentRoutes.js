// const express = require("express");
// const router = express.Router();

// const {
//     addStudent,
//     getStudents,
//     getStudent,
//     getMyProfile,
//     editStudent,
//     removeStudent,
//     changeMyPassword
// } = require("../controllers/studentController");

// const { authenticate } = require("../middleware/authMiddleware");
// const uploadStudentImage = require("../middleware/studentUploadMiddleware");

// router.get("/me", authenticate, getMyProfile);

// router.patch("/me/password", authenticate, changeMyPassword);

// router.get("/", authenticate, getStudents);
// router.post("/", authenticate, uploadStudentImage.single("profileImage"), addStudent);

// router.get("/:id", authenticate, getStudent);
// router.put("/:id", authenticate, uploadStudentImage.single("profileImage"), editStudent);
// router.delete("/:id", authenticate, removeStudent);

// module.exports = router;



const express = require("express");
const router = express.Router();

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent,
    changeMyPassword,
    importStudents
} = require("../controllers/studentController");

const { authenticate } = require("../middleware/authMiddleware");

const uploadStudentImage =
    require("../middleware/studentUploadMiddleware");

// Student profile
router.get("/me", authenticate, getMyProfile);

// Change student password
router.patch("/me/password", authenticate, changeMyPassword);

// Get all students for the dashboard
router.get("/", authenticate, getStudents);

// Import multiple students from CSV
// IMPORTANT: Keep this route before router.get("/:id").
router.post("/import-csv", authenticate, importStudents);

// Add one student manually
router.post(
    "/",
    authenticate,
    uploadStudentImage.single("profileImage"),
    addStudent
);

// Get one student
router.get("/:id", authenticate, getStudent);

// Edit a student
router.put(
    "/:id",
    authenticate,
    uploadStudentImage.single("profileImage"),
    editStudent
);

// Delete a student
router.delete("/:id", authenticate, removeStudent);

module.exports = router;
