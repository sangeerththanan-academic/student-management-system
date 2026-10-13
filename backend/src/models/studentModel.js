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
            users.profile_img_url,
            students.created_at,
            students.updated_at
        FROM students
        JOIN users ON users.user_id = students.user_id
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
            users.profile_img_url,
            students.created_at,
            students.updated_at
        FROM students
        JOIN users ON users.user_id = students.user_id
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
    phoneNumber,
    connection = pool
) => {

    const [result] = await connection.execute(
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
            users.profile_img_url,
            students.created_at,
            students.updated_at
        FROM students
        JOIN users ON users.user_id = students.user_id
        WHERE students.user_id = ?
        LIMIT 1`,
        [userId]
    );

    return rows[0];
};

const updateUserProfileImage = async (connection, userId, username, profileImageUrl) => {
    const [result] = await connection.execute(
        `UPDATE users
        SET username = ?, profile_img_url = COALESCE(?, profile_img_url)
        WHERE user_id = ?`,
        [username, profileImageUrl, userId]
    );

    return result;
};

const setUserProfileImage = async (connection, userId, profileImageUrl) => {
    const [result] = await connection.execute(
        `UPDATE users
        SET profile_img_url = ?
        WHERE user_id = ?`,
        [profileImageUrl, userId]
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
    updateUserProfileImage,
    setUserProfileImage
};
