const pool = require("../config/db");

// CREATE COURSE
const createCourse = async (
    courseCode,
    courseName,
    description,
    credits
) => {
    const [result] = await pool.execute(
        `INSERT INTO courses
        (
            course_code,
            course_name,
            description,
            credits
        )
        VALUES (?, ?, ?, ?)`,
        [
            courseCode,
            courseName,
            description || null,
            credits
        ]
    );

    return result.insertId;
};


// GET ALL COURSES
const getAllCourses = async () => {
    const [rows] = await pool.execute(
        `SELECT
            course_id,
            course_code,
            course_name,
            description,
            credits,
            created_at,
            updated_at
        FROM courses
        ORDER BY course_id DESC`
    );

    return rows;
};


// GET COURSE BY ID
const getCourseById = async (courseId) => {
    const [rows] = await pool.execute(
        `SELECT
            course_id,
            course_code,
            course_name,
            description,
            credits,
            created_at,
            updated_at
        FROM courses
        WHERE course_id = ?
        LIMIT 1`,
        [courseId]
    );

    return rows[0];
};


// GET COURSE BY CODE
const getCourseByCode = async (courseCode) => {
    const [rows] = await pool.execute(
        `SELECT
            course_id,
            course_code,
            course_name,
            description,
            credits,
            created_at,
            updated_at
        FROM courses
        WHERE course_code = ?
        LIMIT 1`,
        [courseCode]
    );

    return rows[0];
};


module.exports = {
    createCourse,
    getAllCourses,
    getCourseById,
    getCourseByCode
};

