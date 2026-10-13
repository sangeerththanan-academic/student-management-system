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
         INNER JOIN users
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
         INNER JOIN users
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



 // DELETE STUDENT AND RELATED USER ACCOUNT
const deleteStudent = async (studentId) => {

    const connection = await pool.getConnection();

    try {
        // Start transaction
        await connection.beginTransaction();

        // Find the user account linked to this student
        const [students] = await connection.execute(
            `SELECT user_id
             FROM students
             WHERE student_id = ?
             LIMIT 1`,
            [studentId]
        );

        // Student does not exist
        if (students.length === 0) {
            await connection.rollback();

            return {
                affectedRows: 0
            };
        }

        const userId = students[0].user_id;

        // Delete student record first
        const [studentResult] = await connection.execute(
            `DELETE FROM students
             WHERE student_id = ?`,
            [studentId]
        );

        // Delete the linked user account
        await connection.execute(
            `DELETE FROM users
             WHERE user_id = ?`,
            [userId]
        );

        // Save both deletions
        await connection.commit();

        return studentResult;

    } catch (error) {

        // Undo changes if anything fails
        await connection.rollback();

        throw error;

    } finally {

        // Release database connection
        connection.release();
    }
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
         INNER JOIN users
            ON students.user_id = users.user_id
         WHERE students.user_id = ?
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
