
const express = require("express");

const {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    updateMyProfile,
    editStudent,
    removeStudent,
    changeMyPassword,
    importStudents
} = require("../controllers/studentController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// STUDENT SELF-SERVICE ROUTES

// Retrieve the authenticated student's profile.
router.get(
    "/me",
    authenticate,
    authorizeRoles("STUDENT"),
    getMyProfile
);

// CR-019: Update the authenticated student's email and phone.
router.put(
    "/me",
    authenticate,
    authorizeRoles("STUDENT"),
    updateMyProfile
);

// Existing CR-020 password-change route.
router.patch(
    "/me/password",
    authenticate,
    authorizeRoles("STUDENT"),
    changeMyPassword
);

// ADMIN-ONLY ROUTES

// CR-015: Import CSV before the /:id route.
router.post(
    "/import-csv",
    authenticate,
    authorizeRoles("ADMIN"),
    importStudents
);

router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    addStudent
);

router.get(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudents
);

router.get(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    getStudent
);

// Existing administrator update route remains unchanged.
router.put(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    editStudent
);

router.delete(
    "/:id",
    authenticate,
    authorizeRoles("ADMIN"),
    removeStudent
);

module.exports = router;




const updateMyStudentContact = async (userId, email, phoneNumber) => {
    const [result] = await pool.execute(
        `UPDATE students
         SET email = ?, phone_number = ?
         WHERE user_id = ?`,
        [email, phoneNumber, userId]
    );

    return result;
};
