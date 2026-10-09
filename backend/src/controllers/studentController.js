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

        //CR-004
        const trimmedFirstName = firstName.trim();
        const trimmedLastName = lastName.trim();
        const trimmedphoneNumber = phoneNumber.trim();
        const trimmedPassword = password.trim();

        const alphabetRegex = /^[A-Za-z\s]+$/;
        const symbolOrNumberRegex = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,}$/;

        if (trimmedFirstName.length < 3 || trimmedLastName.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Require first name and last name to contain at least 3 characters"
            });
        }

        if (symbolOrNumberRegex.test(trimmedFirstName) || symbolOrNumberRegex.test(trimmedLastName)) {
            return res.status(400).json({
                success: false,
                message: "Numbers and symbols are not allowed in first name and last name"
            });
        }

        if (!alphabetRegex.test(trimmedFirstName) || !alphabetRegex.test(trimmedLastName)) {
            return res.status(400).json({
                success: false,
                message: "Alphabetic characters only allowed in first name and last name"
            });
        }

        if (trimmedphoneNumber.length < 10 || trimmedphoneNumber.length > 10) {
            return res.status(400).json({
                success: false,
                message: "Phone number to contain exactly 10 digits"
            });
        }

        if (!phoneRegex.test(trimmedphoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Alphabetic characters and symbols are not allowed in PhoneNumber"
            });
        }

        if (!passwordRegex.test(trimmedPassword)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
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

        //CR-004
        const trimmedFirstName = firstName.trim();
        const trimmedLastName = lastName.trim();
        const trimmedphoneNumber = phoneNumber.trim();

        const alphabetRegex = /^[A-Za-z\s]+$/;
        const symbolOrNumberRegex = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
        const phoneRegex = /^\+?[0-9]{10,15}$/;

        if (trimmedFirstName.length < 3 || trimmedLastName.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Require first name and last name to contain at least 3 characters"
            });
        }

        if (symbolOrNumberRegex.test(trimmedFirstName) || symbolOrNumberRegex.test(trimmedLastName)) {
            return res.status(400).json({
                success: false,
                message: "Numbers and symbols are not allowed in first name and last name"
            });
        }

        if (!alphabetRegex.test(trimmedFirstName) || !alphabetRegex.test(trimmedLastName)) {
            return res.status(400).json({
                success: false,
                message: "Alphabetic characters in first name and last name"
            });
        }

        if (trimmedphoneNumber.length < 10 || trimmedphoneNumber.length > 10) {
            return res.status(400).json({
                success: false,
                message: "Phone number to contain exactly 10 digits"
            });
        }

        if (!phoneRegex.test(trimmedphoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Alphabetic characters and symbols are not allowed in PhoneNumber"
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


module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent
};
