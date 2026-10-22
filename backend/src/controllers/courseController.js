const { getAllAvailableCourses, getCourseById } = require("../models/courseModel");
const { getStudentByUserId } = require("../models/studentModel");

// GET AVAILABLE COURSES
// GET /api/courses
const getAvailableCourses = async (req, res) => {
    try {
        let studentId = null;

        // If the authenticated user is a student, look up their student_id to annotate enrollment status
        if (req.user && req.user.role === "STUDENT") {
            const student = await getStudentByUserId(req.user.userId);
            if (student) {
                studentId = student.student_id;
            }
        }

        const courses = await getAllAvailableCourses(studentId);

        return res.status(200).json({
            success: true,
            count: courses.length,
            courses
        });
    } catch (error) {
        console.error("Get available courses error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve available courses"
        });
    }
};

// GET COURSE BY ID
// GET /api/courses/:id
const getCourse = async (req, res) => {
    try {
        const courseId = parseInt(req.params.id, 10);
        if (isNaN(courseId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid course ID"
            });
        }

        const course = await getCourseById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        return res.status(200).json({
            success: true,
            course
        });
    } catch (error) {
        console.error("Get course error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve course details"
        });
    }
};

module.exports = {
    getAvailableCourses,
    getCourse
};
