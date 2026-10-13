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

const REGISTRATION_NO_REGEX = /^[A-Za-z0-9]{4,20}$/;
const NAME_REGEX = /^[A-Za-z]{3,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// SHARED STUDENT VALIDATION (CR-004)
const validateStudentInput = (data, { requirePassword = false } = {}) => {
    const errors = {};

    const registrationNo = (data.registrationNo || "").trim();
    const firstName = (data.firstName || "").trim();
    const lastName = (data.lastName || "").trim();
    const email = (data.email || "").trim();
    const phoneNumber = (data.phoneNumber || "").trim();
    const password = data.password || "";

    if (!registrationNo) {
        errors.registrationNo = "Registration number is required.";
    } else if (!REGISTRATION_NO_REGEX.test(registrationNo)) {
        errors.registrationNo =
            "Registration number must be 4-20 letters/numbers (e.g. REG001).";
    }

    if (!firstName) {
        errors.firstName = "First name is required.";
    } else if (!NAME_REGEX.test(firstName)) {
        errors.firstName =
            "First name must be at least 3 letters (letters only).";
    }

    if (!lastName) {
        errors.lastName = "Last name is required.";
    } else if (!NAME_REGEX.test(lastName)) {
        errors.lastName =
            "Last name must be at least 3 letters (letters only).";
    }

    if (!email) {
        errors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email)) {
        errors.email = "Enter a valid email address.";
    }

    if (!phoneNumber) {
        errors.phoneNumber = "Phone number is required.";
    } else if (!PHONE_REGEX.test(phoneNumber)) {
        errors.phoneNumber = "Phone number must be exactly 10 digits.";
    }

    if (requirePassword) {
        if (!password) {
            errors.password = "Password is required for a new student.";
        } else if (!PASSWORD_REGEX.test(password)) {
            errors.password =
                "Password must be at least 8 characters and include uppercase, lowercase, number and special character.";
        }
    }

    return errors;
};

const firstValidationError = (errors) => {
    return (
        errors.registrationNo ||
        errors.firstName ||
        errors.lastName ||
        errors.email ||
        errors.phoneNumber ||
        errors.password ||
        null
    );
};


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

        // Validate field formats (CR-004)
        const validationErrors = validateStudentInput(
            {
                registrationNo,
                firstName,
                lastName,
                email,
                phoneNumber,
                password
            },
            { requirePassword: true }
        );

        const validationMessage = firstValidationError(validationErrors);

        if (validationMessage) {
            return res.status(400).json({
                success: false,
                message: validationMessage
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

        // Validate field formats (CR-004)
        const editValidationErrors = validateStudentInput(
            {
                registrationNo,
                firstName,
                lastName,
                email,
                phoneNumber
            },
            { requirePassword: false }
        );

        const editValidationMessage = firstValidationError(
            editValidationErrors
        );

        if (editValidationMessage) {
            return res.status(400).json({
                success: false,
                message: editValidationMessage
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
