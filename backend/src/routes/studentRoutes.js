
const express = require("express");

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent,
    changeMyPassword
} = require("../controllers/studentController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const uploadProfileImage = require("../middleware/uploadMiddleware");

const router = express.Router();

// ============================================================
// GET CURRENT STUDENT'S OWN PROFILE
// ============================================================

router.get(
    "/me",
    authenticate,
    authorizeRoles("STUDENT"),
    getMyProfile
);

// ============================================================
// CR-020: CHANGE CURRENT STUDENT'S PASSWORD
// ============================================================

router.patch(
    "/change-password",
    authenticate,
    authorizeRoles("STUDENT"),
    changeMyPassword
);

// ============================================================
// CREATE STUDENT — ADMIN ONLY
// ============================================================

router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    uploadProfileImage,
    addStudent
);

// ============================================================
// GET ALL STUDENTS — ADMIN ONLY
// ============================================================

router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudents
);

// ============================================================
// GET STUDENT BY ID — ADMIN ONLY
// ============================================================

router.get(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudent
);

// ============================================================
// UPDATE STUDENT — ADMIN ONLY
// ============================================================

router.put(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    editStudent
);

// ============================================================
// DELETE STUDENT — ADMIN ONLY
// ============================================================

router.delete(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    removeStudent
);

module.exports = router;
