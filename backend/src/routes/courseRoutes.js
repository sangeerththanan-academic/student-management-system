// CR06 - Course routes
const express = require('express');
const router = express.Router();
const { createCourse, getCourses } = require('../controllers/courseController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticate, authorizeRoles('ADMIN'));
router.post('/', createCourse);
router.get('/', getCourses);

module.exports = router;
