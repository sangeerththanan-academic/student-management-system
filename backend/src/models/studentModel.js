// const pool = require("../config/db");

// // CREATE STUDENT
// const createStudent = async (
//     connection,
//     userId,
//     registrationNo,
//     firstName,
//     lastName,
//     email,
//     phoneNumber
// ) => {

//     const [result] = await connection.execute(
//         `INSERT INTO students
//         (
//             user_id,
//             registration_no,
//             first_name,
//             last_name,
//             email,
//             phone_number
//         )
//         VALUES (?, ?, ?, ?, ?, ?)`,
//         [
//             userId,
//             registrationNo,
//             firstName,
//             lastName,
//             email,
//             phoneNumber
//         ]
//     );

//     return result.insertId;
// };


// // GET ALL STUDENTS
// const getAllStudents = async () => {

//     const [rows] = await pool.execute(
//         `SELECT
//             student_id,
//             user_id,
//             registration_no,
//             first_name,
//             last_name,
//             email,
//             phone_number,
//             created_at,
//             updated_at
//         FROM students
//         ORDER BY student_id DESC`
//     );

//     return rows;
// };


// // GET STUDENT BY ID
// const getStudentById = async (studentId) => {

//     const [rows] = await pool.execute(
//         `SELECT
//             student_id,
//             user_id,
//             registration_no,
//             first_name,
//             last_name,
//             email,
//             phone_number,
//             created_at,
//             updated_at
//         FROM students
//         WHERE student_id = ?
//         LIMIT 1`,
//         [studentId]
//     );

//     return rows[0];
// };


// // UPDATE STUDENT
// const updateStudent = async (
//     studentId,
//     registrationNo,
//     firstName,
//     lastName,
//     email,
//     phoneNumber
// ) => {

//     const [result] = await pool.execute(
//         `UPDATE students
//         SET
//             registration_no = ?,
//             first_name = ?,
//             last_name = ?,
//             email = ?,
//             phone_number = ?
//         WHERE student_id = ?`,
//         [
//             registrationNo,
//             firstName,
//             lastName,
//             email,
//             phoneNumber,
//             studentId
//         ]
//     );

//     return result;
// };


// // DELETE STUDENT
// const deleteStudent = async (studentId) => {

//     const [result] = await pool.execute(
//         `DELETE FROM students
//         WHERE student_id = ?`,
//         [studentId]
//     );

//     return result;
// };


// // GET STUDENT BY USER ID
// const getStudentByUserId = async (userId) => {

//     const [rows] = await pool.execute(
//         `SELECT
//             student_id,
//             user_id,
//             registration_no,
//             first_name,
//             last_name,
//             email,
//             phone_number,
//             created_at,
//             updated_at
//         FROM students
//         WHERE user_id = ?
//         LIMIT 1`,
//         [userId]
//     );

//     return rows[0];
// };


// module.exports = {
//     createStudent,
//     getAllStudents,
//     getStudentById,
//     getStudentByUserId,
//     updateStudent,
//     deleteStudent
// };



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

// GET ALL STUDENTS
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

// UPDATE STUDENT (EXISTING ADMIN FUNCTION)
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
         SET registration_no = ?,
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

// GET STUDENT BY AUTHENTICATED USER ID
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

// CR-019: UPDATE OWN PROFILE
// Only email and phone number can be changed.
const updateMyProfile = async (
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
    updateMyProfile,
    deleteStudent
};
