const pool = require("../config/db");

// GET ALL AVAILABLE COURSES
// Optionally joins student's enrollments to determine if the student is already enrolled
const getAllAvailableCourses = async (studentId = null) => {
    if (studentId) {
        const [rows] = await pool.execute(
            `SELECT
                c.course_id,
                c.course_code,
                c.title,
                c.description,
                c.category,
                c.level,
                c.duration,
                c.price,
                c.status,
                c.created_at,
                c.updated_at,
                CASE WHEN e.enrollment_id IS NOT NULL THEN 1 ELSE 0 END AS is_enrolled
            FROM courses c
            LEFT JOIN enrollments e
                ON c.course_id = e.course_id
                AND e.student_id = ?
                AND e.status = 'ENROLLED'
            WHERE c.status = 'AVAILABLE'
            ORDER BY c.course_id ASC`,
            [studentId]
        );
        return rows;
    }

    const [rows] = await pool.execute(
        `SELECT
            course_id,
            course_code,
            title,
            description,
            category,
            level,
            duration,
            price,
            status,
            created_at,
            updated_at,
            0 AS is_enrolled
        FROM courses
        WHERE status = 'AVAILABLE'
        ORDER BY course_id ASC`
    );
    return rows;
};

// GET COURSE BY ID
const getCourseById = async (courseId) => {
    const [rows] = await pool.execute(
        `SELECT
            course_id,
            course_code,
            title,
            description,
            category,
            level,
            duration,
            price,
            status,
            created_at,
            updated_at
        FROM courses
        WHERE course_id = ?
        LIMIT 1`,
        [courseId]
    );

    return rows[0] || null;
};

module.exports = {
    getAllAvailableCourses,
    getCourseById
};
