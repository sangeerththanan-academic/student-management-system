const pool = require("../config/db");

// =====================================================
// CR06: CREATE COURSE
// POST /api/courses
// =====================================================

const addCourse = async (req, res) => {
    try {
        const {
            course_code,
            course_name,
            description,
            credits
        } = req.body || {};

        const courseCode =
            typeof course_code === "string"
                ? course_code.trim()
                : "";

        const courseName =
            typeof course_name === "string"
                ? course_name.trim()
                : "";

        const courseDescription =
            typeof description === "string"
                ? description.trim()
                : "";

        const creditValue = Number(credits);

        if (!courseCode || !courseName || credits === undefined || credits === null || credits === "") {
            return res.status(400).json({
                success: false,
                message: "Course code, course name and credits are required."
            });
        }

        if (courseCode.length > 20) {
            return res.status(400).json({
                success: false,
                message: "Course code cannot exceed 20 characters."
            });
        }

        if (courseName.length > 150) {
            return res.status(400).json({
                success: false,
                message: "Course name cannot exceed 150 characters."
            });
        }

        if (
            !Number.isInteger(creditValue) ||
            creditValue <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Credits must be a positive whole number."
            });
        }

        const [existingCourse] = await pool.execute(
            `SELECT course_id
             FROM courses
             WHERE LOWER(course_code) = LOWER(?)
             LIMIT 1`,
            [courseCode]
        );

        if (existingCourse.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Course code already exists."
            });
        }

        await pool.execute(
            `INSERT INTO courses
            (course_code, course_name, description, credits)
            VALUES (?, ?, ?, ?)`,
            [
                courseCode,
                courseName,
                courseDescription || null,
                creditValue
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Course added successfully."
        });

    } catch (error) {
        console.error("Add course error:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Course code already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to add course."
        });
    }
};


// =====================================================
// CR06: GET ALL COURSES
// GET /api/courses
// =====================================================

const getCourses = async (req, res) => {
    try {
        const [courses] = await pool.execute(
            `SELECT
                course_id,
                course_code,
                course_name,
                description,
                credits,
                created_at
             FROM courses
             ORDER BY course_id DESC`
        );

        return res.status(200).json({
            success: true,
            count: courses.length,
            courses
        });

    } catch (error) {
        console.error("Get courses error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve courses."
        });
    }
};


// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
    addCourse,
    getCourses
};