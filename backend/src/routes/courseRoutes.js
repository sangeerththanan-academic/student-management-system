const express = require("express");

const { createCourse, getCourses } = require("../controllers/courseController");
const { authenticate, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, authorizeRoles("ADMIN"), createCourse);
router.get("/", authenticate, authorizeRoles("ADMIN"), getCourses);

module.exports = router;
