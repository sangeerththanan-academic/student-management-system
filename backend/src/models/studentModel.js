
const pool = require("../config/db");

// =====================================================
// CREATE STUDENT
// =====================================================
const createStudent = async (
    connection,
    userId,
    registrationNo,
    firstName,
    lastName,
    email,
    phoneNumber
) => {
    const [result] = await connection.execute(
        `INSERT INTO students
        (
            user_id,
            registration_no,
            first_name,
            last_name,
            email,
            phone_number,
            profile_image
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            null
        ]
    );

    return result.insertId;
};

// =====================================================
// GET ALL STUDENTS
// Includes last_login from the linked user account.
// =====================================================
const getAllStudents = async () => {
    const [rows] = await pool.execute(
        `SELECT
            s.student_id,
            s.user_id,
            s.registration_no,
            s.first_name,
            s.last_name,
            s.email,
            s.phone_number,
            s.profile_image,
            s.created_at,
            s.updated_at,
            u.last_login
        FROM students AS s
        LEFT JOIN users AS u
            ON s.user_id = u.user_id
        ORDER BY s.student_id DESC`
    );

    return rows;
};

// =====================================================
// GET STUDENT BY ID
// =====================================================
const getStudentById = async (studentId) => {
    const [rows] = await pool.execute(
        `SELECT
            student_id,
            user_id,
            registration_no,
            first_name,
            last_name,
            email,
            phone_number,
            profile_image,
            created_at,
            updated_at
        FROM students
        WHERE student_id = ?
        LIMIT 1`,
        [studentId]
    );

    return rows[0] || null;
};

// =====================================================
// UPDATE STUDENT
// =====================================================
const updateStudent = async (
    studentId,
    registrationNo,
    firstName,
    lastName,
    email,
    phoneNumber
) => {
    const [result] = await pool.execute(
        `UPDATE students
         SET
            registration_no = ?,
            first_name = ?,
            last_name = ?,
            email = ?,
            phone_number = ?
         WHERE student_id = ?`,
        [
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            studentId
        ]
    );

    return result;
};

// =====================================================
// DELETE STUDENT + LINKED USER ACCOUNT
// =====================================================
const deleteStudent = async (studentId) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            `SELECT user_id
             FROM students
             WHERE student_id = ?
             LIMIT 1`,
            [studentId]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return { affectedRows: 0 };
        }

        const userId = rows[0].user_id;

        const [studentResult] = await connection.execute(
            `DELETE FROM students
             WHERE student_id = ?`,
            [studentId]
        );

        await connection.execute(
            `DELETE FROM users
             WHERE user_id = ?`,
            [userId]
        );

        await connection.commit();

        return studentResult;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// =====================================================
// GET STUDENT BY USER ID
// =====================================================
const getStudentByUserId = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT
            student_id,
            user_id,
            registration_no,
            first_name,
            last_name,
            email,
            phone_number,
            profile_image,
            created_at,
            updated_at
         FROM students
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0] || null;
};

// =====================================================
// UPDATE STUDENT PROFILE IMAGE
// =====================================================
const updateStudentProfileImage = async (
    studentId,
    profileImage
) => {
    const [result] = await pool.execute(
        `UPDATE students
         SET profile_image = ?
         WHERE student_id = ?`,
        [profileImage, studentId]
    );

    return result;
};

// =====================================================
// EXPORT FUNCTIONS
// =====================================================
module.exports = {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    updateStudent,
    deleteStudent,
    updateStudentProfileImage
};
