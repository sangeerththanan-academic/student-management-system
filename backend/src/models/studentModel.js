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
            students.student_id,
            students.user_id,
            students.registration_no,
            students.first_name,
            students.last_name,
            students.email,
            students.phone_number,
            students.created_at,
            students.updated_at,
            users.last_login
        FROM students
        LEFT JOIN users
            ON students.user_id = users.user_id
        ORDER BY students.student_id DESC`
    );

    return rows;
};

// GET STUDENT BY ID
const getStudentById = async (studentId) => {

    const [rows] = await pool.execute(
        `SELECT
            students.student_id,
            students.user_id,
            students.registration_no,
            students.first_name,
            students.last_name,
            students.email,
            students.phone_number,
            students.created_at,
            students.updated_at,
            users.last_login
        FROM students
        LEFT JOIN users
            ON students.user_id = users.user_id
        WHERE students.student_id = ?
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

    return result;
};

// DELETE STUDENT
const deleteStudent = async (studentId) => {

    const [result] = await pool.execute(
        `DELETE FROM students
        WHERE student_id = ?`,
        [studentId]
    );

    return result;
};

// GET STUDENT BY USER ID
const getStudentByUserId = async (userId) => {

    const [rows] = await pool.execute(
        `SELECT
            students.student_id,
            students.user_id,
            students.registration_no,
            students.first_name,
            students.last_name,
            students.email,
            students.phone_number,
            students.created_at,
            students.updated_at,
            users.last_login
        FROM students
        LEFT JOIN users
            ON students.user_id = users.user_id
        WHERE students.user_id = ?
        LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// CR-019: UPDATE LOGGED-IN STUDENT'S CONTACT DETAILS
// Only email and phone_number are updated, and the record is
// selected by the authenticated user_id (never by a client-supplied id).
const updateStudentContactByUserId = async (
    userId,
    email,
    phoneNumber
) => {

    const [result] = await pool.execute(
        `UPDATE students
        SET
            email = ?,
            phone_number = ?
        WHERE user_id = ?`,
        [
            email,
            phoneNumber,
            userId
        ]
    );

    return result;
};

module.exports = {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    updateStudent,
    updateStudentContactByUserId,
    deleteStudent
};
