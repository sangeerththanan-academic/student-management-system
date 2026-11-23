const express = require("express");
const { addCourse, getCourses } = require("../controllers/courseController");
const { authenticate, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authenticate, authorizeRoles("ADMIN"));
router.get("/", getCourses);
router.post("/", addCourse);

module.exports = router;
