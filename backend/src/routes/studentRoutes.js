<<<<<<< HEAD
=======
// const express = require("express");
// const router = express.Router();

// const {
//     addStudent,
//     getStudents,
//     getStudent,
//     getMyProfile,
//     editStudent,
//     removeStudent
// } = require("../controllers/studentController");

// const { authenticate } = require("../middleware/authMiddleware");

// const uploadStudentImage =
//     require("../middleware/studentUploadMiddleware");

// // GET /api/students/me
// router.get("/me", authenticate, getMyProfile);

// // GET /api/students
// router.get("/", authenticate, getStudents);

// // GET /api/students/:id
// router.get("/:id", authenticate, getStudent);

// // POST /api/students
// router.post(
//     "/",
//     authenticate,
//     uploadStudentImage.single("profileImage"),
//     addStudent
// );

// // PUT /api/students/:id
// router.put(
//     "/:id",
//     authenticate,
//     uploadStudentImage.single("profileImage"),
//     editStudent
// );

// // DELETE /api/students/:id
// router.delete("/:id", authenticate, removeStudent);

// module.exports = router;



>>>>>>> JFICT32/CR026

const express = require("express");
const router = express.Router();

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    updateMyProfile,
    editStudent,
    removeStudent,
    changeMyPassword
} = require("../controllers/studentController");

const { authenticate } = require("../middleware/authMiddleware");
const uploadStudentImage = require("../middleware/studentUploadMiddleware");

router.get("/me", authenticate, getMyProfile);

<<<<<<< HEAD
// =====================================================
// CURRENT STUDENT PROFILE
// =====================================================

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
    updateMyProfile
);

// =====================================================
// ADMIN STUDENT MANAGEMENT
// =====================================================

// Create student
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    addStudent
);

// Get all students
router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudents
);

// Get student by ID
router.get(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudent
);

// Update student
router.put(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
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
=======
router.patch("/me/password", authenticate, changeMyPassword);

router.get("/", authenticate, getStudents);
router.post("/", authenticate, uploadStudentImage.single("profileImage"), addStudent);

router.get("/:id", authenticate, getStudent);
router.put("/:id", authenticate, uploadStudentImage.single("profileImage"), editStudent);
router.delete("/:id", authenticate, removeStudent);

module.exports = router;
>>>>>>> JFICT32/CR026
