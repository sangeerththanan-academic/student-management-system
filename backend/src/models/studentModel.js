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
        ORDER BY student_id DESC`
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


// CHECK WHETHER AN EMAIL IS USED BY ANOTHER STUDENT
const emailBelongsToAnotherStudent = async (email, userId) => {
    const [rows] = await pool.execute(
        `SELECT student_id
        FROM students
        WHERE email = ? AND user_id <> ?
        LIMIT 1`,
        [email, userId]
    );

    return rows.length > 0;
};


// UPDATE THE CURRENT STUDENT'S CONTACT DETAILS
const updateStudentContactByUserId = async (
    userId,
    email,
    phoneNumber
) => {
    const [result] = await pool.execute(
        `UPDATE students
        SET email = ?, phone_number = ?
        WHERE user_id = ?`,
        [email, phoneNumber, userId]
    );

    return result;
};


module.exports = {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    emailBelongsToAnotherStudent,
    updateStudentContactByUserId,
    updateStudent,
    deleteStudent
};
