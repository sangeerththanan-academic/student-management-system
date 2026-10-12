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


module.exports = {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    updateStudent,
    deleteStudent
};
