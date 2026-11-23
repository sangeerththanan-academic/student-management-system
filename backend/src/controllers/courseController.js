// CR006: Course creation and retrieval.
const pool = require("../config/db");

const normalizeValue = (value) => (
    typeof value === "string" ? value.trim() : ""
);

const validateCourse = ({ courseCode, courseName, description, credits }) => {
    const errors = {};

    if (!courseCode) {
        errors.courseCode = "Course code is required.";
    } else if (!/^[A-Za-z0-9-]{2,20}$/.test(courseCode)) {
        errors.courseCode =
            "Course code must contain 2-20 letters, numbers, or hyphens.";
    }

    if (!courseName) {
        errors.courseName = "Course name is required.";
    } else if (courseName.length < 3) {
        errors.courseName =
            "Course name must contain at least 3 characters.";
    }

    if (description && description.length > 1000) {
        errors.description =
            "Description must not exceed 1000 characters.";
    }

    if (credits === "" || credits === null || credits === undefined) {
        errors.credits = "Credits are required.";
    } else if (!Number.isInteger(Number(credits)) ||
        Number(credits) < 1 ||
        Number(credits) > 30) {
        errors.credits =
            "Credits must be a whole number from 1 to 30.";
    }

    return errors;
};

const createCourse = async (req, res) => {
    const payload = req.body || {};
    const courseCode = normalizeValue(payload.courseCode).toUpperCase();
    const courseName = normalizeValue(payload.courseName);
    const description = normalizeValue(payload.description);
    const credits = payload.credits;

    const validationErrors = validateCourse({
        courseCode,
        courseName,
        description,
        credits
    });

    if (Object.keys(validationErrors).length > 0) {
        return res.status(400).json({
            success: false,
            message: "Please correct the validation errors.",
            errors: validationErrors
        });
    }

    try {
        const [existing] = await pool.execute(
            "SELECT course_id FROM courses WHERE course_code = ?",
            [courseCode]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Course code is already registered.",
                errors: {
                    courseCode: "Course code is already registered."
                }
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO courses
                (course_code, course_name, description, credits)
             VALUES (?, ?, ?, ?)`,
            [courseCode, courseName, description, Number(credits)]
        );

        return res.status(201).json({
            success: true,
            message: "Course created successfully.",
            course: {
                course_id: result.insertId,
                course_code: courseCode,
                course_name: courseName,
                description,
                credits: Number(credits)
            }
        });
    } catch (error) {
        console.error("CR006 create course error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create course."
        });
    }
};

const getCourses = async (req, res) => {
    try {
        const [courses] = await pool.execute(
            `SELECT course_id, course_code, course_name,
                    description, credits, created_at, updated_at
             FROM courses
             ORDER BY course_name ASC`
        );

        return res.status(200).json({
            success: true,
            courses
        });
    } catch (error) {
        console.error("CR006 get courses error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve courses."
        });
    }
};

module.exports = {
    createCourse,
    getCourses
};