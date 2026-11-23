const pool = require("../config/db");

const getCourses = async (req, res) => {
    try {
        const [courses] = await pool.execute(
            "SELECT course_id, course_code, course_name, description, credits, created_at FROM courses ORDER BY course_name ASC"
        );
        return res.status(200).json({ success: true, courses });
    } catch (error) {
        console.error("Get courses error:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve courses" });
    }
};

const addCourse = async (req, res) => {
    const courseCode = String(req.body.courseCode ?? "").trim().toUpperCase();
    const courseName = String(req.body.courseName ?? "").trim();
    const description = String(req.body.description ?? "").trim();
    const credits = Number(req.body.credits);

    if (!courseCode || !/^[A-Z0-9-]{2,30}$/.test(courseCode)) {
        return res.status(400).json({ success: false, message: "Course code must be 2–30 letters, numbers, or hyphens." });
    }
    if (!courseName || courseName.length > 150) {
        return res.status(400).json({ success: false, message: "Course name is required and must be 150 characters or fewer." });
    }
    if (!description) {
        return res.status(400).json({ success: false, message: "Description is required." });
    }
    if (!Number.isInteger(credits) || credits < 1 || credits > 30) {
        return res.status(400).json({ success: false, message: "Credits must be a whole number from 1 to 30." });
    }

    try {
        const [result] = await pool.execute(
            "INSERT INTO courses (course_code, course_name, description, credits) VALUES (?, ?, ?, ?)",
            [courseCode, courseName, description, credits]
        );
        return res.status(201).json({
            success: true,
            message: "Course created successfully",
            course: { course_id: result.insertId, course_code: courseCode, course_name: courseName, description, credits }
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ success: false, message: "That course code is already in use." });
        }
        console.error("Create course error:", error);
        return res.status(500).json({ success: false, message: "Failed to create course" });
    }
};

module.exports = { getCourses, addCourse };
