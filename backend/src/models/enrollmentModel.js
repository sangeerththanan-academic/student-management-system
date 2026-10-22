const pool = require("../config/db");

// CREATE ENROLLMENT
const createEnrollment = async (studentId, courseId) => {
    const [result] = await pool.execute(
        `INSERT INTO enrollments (student_id, course_id, status)
        VALUES (?, ?, 'ENROLLED')`,
        [studentId, courseId]
    );

    return result.insertId;
};

// GET ENROLLMENT BY STUDENT AND COURSE
const getEnrollmentByStudentAndCourse = async (studentId, courseId) => {
    const [rows] = await pool.execute(
        `SELECT
            enrollment_id,
            student_id,
            course_id,
            status,
            enrollment_date,
            created_at,
            updated_at
        FROM enrollments
        WHERE student_id = ? AND course_id = ? AND status = 'ENROLLED'
        LIMIT 1`,
        [studentId, courseId]
    );

    return rows[0] || null;
};

// GET ENROLLMENTS BY STUDENT ID
const getEnrollmentsByStudentId = async (studentId) => {
    const [rows] = await pool.execute(
        `SELECT
            e.enrollment_id,
            e.student_id,
            e.course_id,
            e.status,
            e.enrollment_date,
            c.course_code,
            c.title,
            c.category,
            c.level,
            c.duration,
            c.price
        FROM enrollments e
        JOIN courses c ON e.course_id = c.course_id
        WHERE e.student_id = ?
        ORDER BY e.enrollment_id DESC`,
        [studentId]
    );

    return rows;
};

module.exports = {
    createEnrollment,
    getEnrollmentByStudentAndCourse,
    getEnrollmentsByStudentId
};
