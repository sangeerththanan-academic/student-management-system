const {
    createCourse,
    getAllCourses,
    getCourseById,
    getCourseByCode
} = require("../models/courseModel");


// CREATE COURSE (POST /api/courses)
const addCourse = async (req, res) => {
    const {
        courseCode,
        course_code,
        courseName,
        course_name,
        description,
        credits
    } = req.body;

    const code = (courseCode || course_code || "").trim();
    const name = (courseName || course_name || "").trim();
    const desc = (description || "").trim();
    const parsedCredits = Number(credits);

    try {
        // Validate required fields
        if (!code || !name) {
            return res.status(400).json({
                success: false,
                message: "Course code and course name are required"
            });
        }

        if (credits === undefined || credits === null || credits === "" || isNaN(parsedCredits) || parsedCredits < 0) {
            return res.status(400).json({
                success: false,
                message: "Credits must be a valid positive number"
            });
        }

        // Check duplicate course code
        const existingCourse = await getCourseByCode(code);
        if (existingCourse) {
            return res.status(409).json({
                success: false,
                message: "Course code is already registered"
            });
        }

        // Create course
        const courseId = await createCourse(code, name, desc, parsedCredits);
        const newCourse = await getCourseById(courseId);

        return res.status(201).json({
            success: true,
            message: "Course created successfully",
            courseId,
            course: newCourse
        });

    } catch (error) {
        console.error("Create course error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create course"
        });
    }
};


// GET ALL COURSES (GET /api/courses)
const getCourses = async (req, res) => {
    try {
        const courses = await getAllCourses();

        return res.status(200).json({
            success: true,
            count: courses.length,
            courses
        });

    } catch (error) {
        console.error("Get courses error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve courses"
        });
    }
};


// GET COURSE BY ID (GET /api/courses/:id)
const getCourse = async (req, res) => {
    const { id } = req.params;

    try {
        const course = await getCourseById(id);

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
            message: error.message || "Failed to retrieve course"
        });
    }
};


module.exports = {
    addCourse,
    getCourses,
    getCourse
};

