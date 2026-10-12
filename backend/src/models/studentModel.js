
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
        `INSERT INTO students
        (
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
            student_id,
            user_id,
            registration_no,
            first_name,
            last_name,
            email,
            phone_number,
            profile_photo,
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
            profile_photo,
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
// Preserve the existing image when no new image is uploaded.
const updateStudent = async (
    studentId,
    registrationNo,
    firstName,
    lastName,
    email,
    phoneNumber,
    profilePhoto
) => {
    let query;
    let values;

    if (profilePhoto !== undefined) {
        query = `UPDATE students
            SET
                registration_no = ?,
                first_name = ?,
                last_name = ?,
                email = ?,
                phone_number = ?,
                profile_photo = ?
            WHERE student_id = ?`;

        values = [
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            profilePhoto,
            studentId
        ];
    } else {
        query = `UPDATE students
            SET
                registration_no = ?,
                first_name = ?,
                last_name = ?,
                email = ?,
                phone_number = ?
            WHERE student_id = ?`;

        values = [
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            studentId
        ];
    }

    const [result] = await pool.execute(query, values);

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
            profile_photo,
            created_at,
            updated_at
        FROM students
        WHERE user_id = ?
        LIMIT 1`,
        [userId]
    );

    return rows[0];
};

module.exports = {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    updateStudent,
    deleteStudent
};