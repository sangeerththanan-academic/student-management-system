
const pool = require("../config/db");

// CREATE STUDENT
const createStudent = async (
    connection,
    userId,
    registrationNo,
    firstName,
    lastName,
    email,
    phoneNumber,
    profilePhoto = null
) => {
    const [result] = await connection.execute(
        `INSERT INTO students (
            user_id,
            registration_no,
            first_name,
            last_name,
            email,
            phone_number,
            profile_photo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            profilePhoto
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
            s.profile_photo,
            s.created_at,
            s.updated_at,
            u.last_login
        FROM students AS s
        INNER JOIN users AS u ON s.user_id = u.user_id
        ORDER BY s.student_id DESC`
    );

    return rows;
};

// GET STUDENT BY ID
const getStudentById = async (studentId) => {
    const [rows] = await pool.execute(
        `SELECT
            s.student_id,
            s.user_id,
            s.registration_no,
            s.first_name,
            s.last_name,
            s.email,
            s.phone_number,
            s.profile_photo,
            s.created_at,
            s.updated_at,
            u.last_login
        FROM students AS s
        INNER JOIN users AS u ON s.user_id = u.user_id
        WHERE s.student_id = ?
        LIMIT 1`,
        [studentId]
    );

    return rows[0];
};

// UPDATE STUDENT PROFILE
const updateStudent = async (
    studentId,
    registrationNo,
    firstName,
    lastName,
    email,
    phoneNumber,
    profilePhoto
) => {
    const [result] = await pool.execute(
        `UPDATE students
         SET registration_no = ?,
             first_name = ?,
             last_name = ?,
             email = ?,
             phone_number = ?,
             profile_photo = ?
         WHERE student_id = ?`,
        [
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            profilePhoto,
            studentId
        ]
    );

    return result;
};

// DELETE STUDENT
const deleteStudent = async (studentId) => {
    const [result] = await pool.execute(
        `DELETE FROM students WHERE student_id = ?`,
        [studentId]
    );

    return result;
};

// GET STUDENT BY USER ID
const getStudentByUserId = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT
            s.student_id,
            s.user_id,
            s.registration_no,
            s.first_name,
            s.last_name,
            s.email,
            s.phone_number,
            s.profile_photo,
            s.created_at,
            s.updated_at,
            u.last_login
        FROM students AS s
        INNER JOIN users AS u ON s.user_id = u.user_id
        WHERE s.user_id = ?
        LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// CR-020: GET USER PASSWORD HASH
const getPasswordHashByUserId = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT user_id, password_hash, role
         FROM users
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};

// CR-020: UPDATE STUDENT PASSWORD HASH
const updatePasswordHash = async (userId, passwordHash) => {
    const [result] = await pool.execute(
        `UPDATE users
         SET password_hash = ?
         WHERE user_id = ?
           AND role = 'STUDENT'`,
        [passwordHash, userId]
    );

    return result;
};

module.exports = {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    updateStudent,
    deleteStudent,
    getPasswordHashByUserId,
    updatePasswordHash
};
