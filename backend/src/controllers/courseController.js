const pool = require("../config/db");

const createCourse = async (req, res) => {
    const courseCode = String(req.body.courseCode ?? "").trim();
    const courseName = String(req.body.courseName ?? "").trim();
    const description = String(req.body.description ?? "").trim();
    const credits = Number(req.body.credits);

    if (!courseCode || !courseName || !description) {
        return res.status(400).json({
            success: false,
            message: "Course code, course name, and description are required."
        });
    }

    if (!Number.isInteger(credits) || credits < 1 || credits > 30) {
        return res.status(400).json({
            success: false,
            message: "Credits must be a whole number from 1 to 30."
        });
    }

    try {
        const [existing] = await pool.execute(
            "SELECT course_id FROM courses WHERE course_code = ?",
            [courseCode]
        );

        if (existing.length) {
            return res.status(409).json({
                success: false,
                message: "A course with this course code already exists."
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO courses (course_code, course_name, description, credits)
             VALUES (?, ?, ?, ?)`,
            [courseCode, courseName, description, credits]
        );

        return res.status(201).json({
            success: true,
            message: "Course created successfully.",
            course: {
                course_id: result.insertId,
                course_code: courseCode,
                course_name: courseName,
                description,
                credits
            }
        });
    } catch (error) {
        console.error("Create course error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create course."
        });
    }
};

const getCourses = async (_req, res) => {
    try {
        const [courses] = await pool.execute(
            `SELECT course_id, course_code, course_name, description, credits, created_at, updated_at
             FROM courses
             ORDER BY course_id DESC`
        );

        return res.status(200).json({
            success: true,
            courses
        });
    } catch (error) {
        console.error("Get courses error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve courses."
        });
    }
};

module.exports = { createCourse, getCourses };
