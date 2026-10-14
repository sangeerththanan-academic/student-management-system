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




const express = require("express");
const router = express.Router();

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent,
    changeMyPassword
} = require("../controllers/studentController");

const { authenticate } = require("../middleware/authMiddleware");
const uploadStudentImage = require("../middleware/studentUploadMiddleware");

router.get("/me", authenticate, getMyProfile);

router.patch("/me/password", authenticate, changeMyPassword);

router.get("/", authenticate, getStudents);
router.post("/", authenticate, uploadStudentImage.single("profileImage"), addStudent);

router.get("/:id", authenticate, getStudent);
router.put("/:id", authenticate, uploadStudentImage.single("profileImage"), editStudent);
router.delete("/:id", authenticate, removeStudent);

module.exports = router;