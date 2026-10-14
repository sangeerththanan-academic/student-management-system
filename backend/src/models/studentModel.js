const pool = require("../config/db");

// CREATE STUDENT
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
            phone_number
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            userId,
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        ]
    );

    return result.insertId;
};


// GET ALL STUDENTS
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
            s.created_at,
            s.updated_at,
            u.last_login
        FROM students s
        INNER JOIN users u ON s.user_id = u.user_id
        ORDER BY s.student_id DESC`
    );

    return rows;
};


// GET STUDENT BY ID
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
            created_at,
            updated_at
        FROM students
        WHERE student_id = ?
        LIMIT 1`,
        [studentId]
    );

    return rows[0];
};


// UPDATE STUDENT
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

    // Keep linked user record (username and email) synchronized
    await pool.execute(
        `UPDATE users u
         JOIN students s ON s.user_id = u.user_id
         SET u.username = ?, u.email = ?
         WHERE s.student_id = ?`,
        [
            registrationNo,
            email,
            studentId
        ]
    );

    return result;
};


// DELETE STUDENT + LINKED USER ACCOUNT
// Deletes both rows so registration_no / username can be reused.
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

        // Must delete child first (FK is ON DELETE RESTRICT)
        const [studentResult] = await connection.execute(
            `DELETE FROM students
            WHERE student_id = ?`,
            [studentId]
        );

        // Delete orphan login, otherwise users.username UNIQUE
        // blocks reusing the same registration number.
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


// GET STUDENT BY USER ID
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
            created_at,
            updated_at
        FROM students
        WHERE user_id = ?
        LIMIT 1`,
        [userId]
    );

    return rows[0];
};


// GET STUDENT WITH PASSWORD HASH BY ID
const getStudentWithPasswordById = async (studentId) => {

    const [rows] = await pool.execute(
        `SELECT
            s.student_id,
            s.user_id,
            s.registration_no,
            s.first_name,
            s.last_name,
            s.email,
            s.phone_number,
            u.password_hash
        FROM students s
        INNER JOIN users u ON s.user_id = u.user_id
        WHERE s.student_id = ?
        LIMIT 1`,
        [studentId]
    );

    return rows[0];
};


// UPDATE STUDENT PASSWORD IN USERS TABLE
const updateStudentPassword = async (userId, passwordHash) => {

    const [result] = await pool.execute(
        `UPDATE users
        SET password_hash = ?
        WHERE user_id = ?`,
        [passwordHash, userId]
    );

    return result;
};


module.exports = {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    getStudentWithPasswordById,
    updateStudent,
    deleteStudent,
    updateStudentPassword
};

