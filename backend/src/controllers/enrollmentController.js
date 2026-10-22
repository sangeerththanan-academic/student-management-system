const {
    createEnrollment,
    getEnrollmentByStudentAndCourse,
    getEnrollmentsByStudentId
} = require("../models/enrollmentModel");
const { getCourseById } = require("../models/courseModel");
const { getStudentByUserId } = require("../models/studentModel");

// ENROLL IN A COURSE
// POST /api/enrollments
const enrollStudent = async (req, res) => {
    try {
        // SEC-001 & SEC-002: Authenticated student check
        if (!req.user || req.user.role !== "STUDENT") {
            return res.status(403).json({
                success: false,
                message: "Only authenticated students are allowed to enroll in courses"
            });
        }

        const rawCourseId = req.body.courseId || req.body.course_id;
        const courseId = parseInt(rawCourseId, 10);

        // Validation: course ID required and must be a valid positive integer
        if (!courseId || isNaN(courseId) || courseId <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid course ID is required for enrollment"
            });
        }

        // Retrieve student record linked to the authenticated user account
        const student = await getStudentByUserId(req.user.userId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found for the authenticated user"
            });
        }

        // Validate course existence
        const course = await getCourseById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "The selected course does not exist"
            });
        }

        // Validate course availability
        if (course.status !== "AVAILABLE") {
            return res.status(400).json({
                success: false,
                message: `Course is not available for enrollment (Status: ${course.status})`
            });
        }

        // Check for duplicate enrollment
        const existingEnrollment = await getEnrollmentByStudentAndCourse(
            student.student_id,
            courseId
        );

        if (existingEnrollment) {
            return res.status(409).json({
                success: false,
                message: `You are already enrolled in "${course.title}"`
            });
        }

        // Process enrollment in database
        const enrollmentId = await createEnrollment(
            student.student_id,
            courseId
        );

        return res.status(201).json({
            success: true,
            message: `Successfully enrolled in ${course.title}`,
            enrollment: {
                enrollmentId,
                studentId: student.student_id,
                courseId: course.course_id,
                courseCode: course.course_code,
                courseTitle: course.title,
                category: course.category,
                level: course.level,
                duration: course.duration,
                price: course.price,
                status: "ENROLLED"
            }
        });
    } catch (error) {
        console.error("Enroll student error:", error);

        // Handle MySQL duplicate key violation (if race condition occurs)
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "You are already enrolled in this course"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to complete course enrollment. Please try again."
        });
    }
};

// GET CURRENT STUDENT'S ENROLLMENTS
// GET /api/enrollments/my
const getMyEnrollments = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "STUDENT") {
            return res.status(403).json({
                success: false,
                message: "Only students can access their enrollments"
            });
        }

        const student = await getStudentByUserId(req.user.userId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found"
            });
        }

        const enrollments = await getEnrollmentsByStudentId(student.student_id);

        return res.status(200).json({
            success: true,
            count: enrollments.length,
            enrollments
        });
    } catch (error) {
        console.error("Get my enrollments error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve enrollments"
        });
    }
};

module.exports = {
    enrollStudent,
    getMyEnrollments
};
