const bcrypt = require("bcryptjs");

const pool = require("../config/db");

const {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    updateStudent,
    deleteStudent
} = require("../models/studentModel");


// CREATE STUDENT
const addStudent = async (req, res) => {

    const {
        registrationNo,
        firstName,
        lastName,
        email,
        phoneNumber,
        password
    } = req.body;

    let connection;

    try {

        // Validate required fields
        if (
            !registrationNo ||
            !firstName ||
            !lastName ||
            !email ||
            !phoneNumber ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: "All student fields and password are required"
            });
        }


        // Get database connection
        connection = await pool.getConnection();


        // Start transaction
        await connection.beginTransaction();


        // Check duplicate username
        const [existingUser] = await connection.execute(
            `SELECT user_id
             FROM users
             WHERE username = ?
             LIMIT 1`,
            [registrationNo]
        );

        if (existingUser.length > 0) {

            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered"
            });
        }


        // Check duplicate email
        const [existingStudent] = await connection.execute(
            `SELECT student_id
             FROM students
             WHERE email = ?
             LIMIT 1`,
            [email]
        );

        if (existingStudent.length > 0) {

            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Email address is already registered"
            });
        }


        // Hash student password
        const passwordHash = await bcrypt.hash(password, 10);


        // Create user account
        const [userResult] = await connection.execute(
            `INSERT INTO users
            (
                username,
                password_hash,
                role
            )
            VALUES (?, ?, 'STUDENT')`,
            [
                registrationNo,
                passwordHash
            ]
        );

        const userId = userResult.insertId;


        // Create student profile
        const studentId = await createStudent(
            connection,
            userId,
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        );


        // Commit transaction
        await connection.commit();


        // Success response
        return res.status(201).json({
            success: true,
            message: "Student account and profile created successfully",
            student: {
                studentId,
                userId,
                registrationNo,
                firstName,
                lastName,
                email,
                phoneNumber,
                role: "STUDENT"
            }
        });

    } catch (error) {

        // Rollback if transaction started
        if (connection) {
            await connection.rollback();
        }

        console.error("Create student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create student"
        });

    } finally {

        // Release connection
        if (connection) {
            connection.release();
        }
    }
};


// GET ALL STUDENTS
const getStudents = async (req, res) => {

    try {

        const students = await getAllStudents();

        return res.status(200).json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {

        console.error("Get students error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve students"
        });
    }
};


// GET STUDENT BY ID
// GET /api/students/:id
const getStudent = async (req, res) => {

    try {

        const studentId = req.params.id;

        const student = await getStudentById(studentId);

        if (!student) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        return res.status(200).json({
            success: true,
            student
        });

    } catch (error) {

        console.error("Get student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve student"
        });
    }
};


// UPDATE STUDENT
// PUT /api/students/:id
const editStudent = async (req, res) => {

    try {

        const studentId = req.params.id;

        const {
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        } = req.body;


        // Validate input
        if (
            !registrationNo ||
            !firstName ||
            !lastName ||
            !email ||
            !phoneNumber
        ) {

            return res.status(400).json({
                success: false,
                message: "All student fields are required"
            });
        }


        // Check student exists
        const existingStudent = await getStudentById(studentId);

        if (!existingStudent) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }


        // Update student
        const result = await updateStudent(
            studentId,
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        );


        return res.status(200).json({
            success: true,
            message: "Student updated successfully",
            affectedRows: result.affectedRows
        });

    } catch (error) {

        console.error("Update student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update student"
        });
    }
};


// DELETE STUDENT
// DELETE /api/students/:id
const removeStudent = async (req, res) => {

    try {

        const studentId = req.params.id;

        // Check student exists
        const student = await getStudentById(studentId);

        if (!student) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }


        // Delete student
        const result = await deleteStudent(studentId);

        return res.status(200).json({
            success: true,
            message: "Student deleted successfully",
            affectedRows: result.affectedRows
        });

    } catch (error) {

        console.error("Delete student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete student"
        });
    }
};


// GET CURRENT STUDENT'S OWN PROFILE
const getMyProfile = async (req, res) => {
    try {
        const student = await getStudentByUserId(req.user.userId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found"
            });
        }

        return res.status(200).json({
            success: true,
            student
        });

    } catch (error) {
        console.error("Get my profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve profile"
        });
    }
};

// CR-019: Update the authenticated student's own email and phone number.
const updateMyProfile = async (req, res) => {
    const email =
        typeof req.body?.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";
    const phoneNumber =
        typeof req.body?.phoneNumber === "string"
            ? req.body.phoneNumber.trim()
            : "";
    const errors = {};

    if (!email) {
        errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Please enter a valid email address.";
    }

    if (!phoneNumber) {
        errors.phoneNumber = "Phone number is required.";
    } else if (!/^\d{10}$/.test(phoneNumber)) {
        errors.phoneNumber =
            "Phone number must contain exactly 10 digits.";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            message: "Please correct the validation errors.",
            errors
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        const userId = req.user.userId;
        const existingStudent = await getStudentByUserId(userId);

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found."
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [existingUsers] = await connection.execute(
            `SELECT user_id
             FROM users
             WHERE email = ?
               AND user_id <> ?`,
            [email, userId]
        );
        const [existingStudents] = await connection.execute(
            `SELECT student_id
             FROM students
             WHERE email = ?
               AND student_id <> ?`,
            [email, existingStudent.student_id]
        );

        if (existingUsers.length > 0 || existingStudents.length > 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(409).json({
                success: false,
                message: "Email address is already registered.",
                errors: {
                    email: "Email address is already registered."
                }
            });
        }

        await connection.execute(
            `UPDATE users
             SET email = ?
             WHERE user_id = ?`,
            [email, userId]
        );
        await connection.execute(
            `UPDATE students
             SET email = ?, phone_number = ?
             WHERE student_id = ?`,
            [email, phoneNumber, existingStudent.student_id]
        );

        await connection.commit();
        transactionStarted = false;

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            student: {
                ...existingStudent,
                email,
                phone_number: phoneNumber
            }
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Profile update rollback error:", rollbackError);
            }
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Email address is already registered."
            });
        }

        console.error("Update my profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update profile."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    updateMyProfile,
    editStudent,
    removeStudent
};
