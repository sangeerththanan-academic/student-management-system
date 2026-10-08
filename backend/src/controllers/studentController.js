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

const { validateStudentData } = require("../utils/validation");


// =====================================================
// VALIDATION HELPERS
// =====================================================

// Validate name
const validateName = (name, fieldName) => {

    if (!name || !name.trim()) {
        return `${fieldName} is required`;
    }

    if (name.trim().length < 3) {
        return `${fieldName} must contain at least 3 characters`;
    }

    // Allows letters and spaces only
    if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name.trim())) {
        return `${fieldName} must contain only letters`;
    }

    return null;
};


// Validate email
const validateEmail = (email) => {

    if (!email || !email.trim()) {
        return "Email address is required";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return "Please enter a valid email address";
    }

    return null;
};


// Validate phone number
const validatePhoneNumber = (phoneNumber) => {

    if (!phoneNumber || !String(phoneNumber).trim()) {
        return "Phone number is required";
    }

    if (!/^\d+$/.test(String(phoneNumber).trim())) {
        return "Phone number must contain only digits";
    }

    if (String(phoneNumber).trim().length < 10) {
        return "Phone number must contain exactly 10 digits";
    }

    if (String(phoneNumber).trim().length > 10) {
        return "Phone number must contain exactly 10 digits";
    }

    return null;
};


// Validate password
const validatePassword = (password) => {

    if (!password) {
        return "Password is required";
    }

    if (password.length < 8) {
        return "Password must be at least 8 characters";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter";
    }

    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter";
    }

    if (!/\d/.test(password)) {
        return "Password must contain at least one number";
    }

    if (!/[@$!%*?&]/.test(password)) {
        return "Password must contain at least one special character";
    }

    return null;
};


// =====================================================
// CREATE STUDENT
// POST /api/students/
// =====================================================

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

<<<<<<< HEAD
        // -------------------------------------------------
        // Required field validation
        // -------------------------------------------------

        if (
            !registrationNo ||
            !firstName ||
            !lastName ||
            !email ||
            !phoneNumber ||
            !password
        ) {

=======
        // Validate input data (CR-004)
        const validation = validateStudentData(req.body, false);
        if (!validation.isValid) {
>>>>>>> origin/JFICT16/CR004
            return res.status(400).json({
                success: false,
                message: validation.firstError,
                errors: validation.errors
            });
        }


        // -------------------------------------------------
        // Registration number validation
        // -------------------------------------------------

        if (!registrationNo.trim()) {

            return res.status(400).json({
                success: false,
                message: "Registration number is required"
            });
        }


        // -------------------------------------------------
        // First name validation
        // -------------------------------------------------

        const firstNameError = validateName(
            firstName,
            "First name"
        );

        if (firstNameError) {

            return res.status(400).json({
                success: false,
                message: firstNameError
            });
        }


        // -------------------------------------------------
        // Last name validation
        // -------------------------------------------------

        const lastNameError = validateName(
            lastName,
            "Last name"
        );

        if (lastNameError) {

            return res.status(400).json({
                success: false,
                message: lastNameError
            });
        }


        // -------------------------------------------------
        // Email validation
        // -------------------------------------------------

        const emailError = validateEmail(email);

        if (emailError) {

            return res.status(400).json({
                success: false,
                message: emailError
            });
        }


        // -------------------------------------------------
        // Phone validation
        // -------------------------------------------------

        const phoneError = validatePhoneNumber(phoneNumber);

        if (phoneError) {

            return res.status(400).json({
                success: false,
                message: phoneError
            });
        }


        // -------------------------------------------------
        // Password validation
        // -------------------------------------------------

        const passwordError = validatePassword(password);

        if (passwordError) {

            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }


        // -------------------------------------------------
        // Get database connection
        // -------------------------------------------------

        connection = await pool.getConnection();


        // -------------------------------------------------
        // Start transaction
        // -------------------------------------------------

        await connection.beginTransaction();


        // -------------------------------------------------
        // Check duplicate registration number
        // -------------------------------------------------

        const [existingUser] = await connection.execute(
            `SELECT user_id
             FROM users
             WHERE username = ?
             LIMIT 1`,
            [registrationNo.trim()]
        );

        if (existingUser.length > 0) {

            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered"
            });
        }


        // -------------------------------------------------
        // Check duplicate email
        // -------------------------------------------------

        const [existingStudent] = await connection.execute(
            `SELECT student_id
             FROM students
             WHERE email = ?
             LIMIT 1`,
            [email.trim()]
        );

        if (existingStudent.length > 0) {

            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Email address is already registered"
            });
        }


        // -------------------------------------------------
        // Hash password
        // -------------------------------------------------

        const passwordHash = await bcrypt.hash(
            password,
            10
        );


        // -------------------------------------------------
        // Create user account
        // -------------------------------------------------

        const [userResult] = await connection.execute(
            `INSERT INTO users
            (
                username,
                password_hash,
                role
            )
            VALUES (?, ?, 'STUDENT')`,
            [
                registrationNo.trim(),
                passwordHash
            ]
        );

        const userId = userResult.insertId;


        // -------------------------------------------------
        // Create student profile
        // -------------------------------------------------

        const studentId = await createStudent(
            connection,
            userId,
            registrationNo.trim(),
            firstName.trim(),
            lastName.trim(),
            email.trim(),
            phoneNumber.trim()
        );


        // -------------------------------------------------
        // Commit transaction
        // -------------------------------------------------

        await connection.commit();


        // -------------------------------------------------
        // Success response
        // -------------------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Student account and profile created successfully",

            student: {
                studentId,
                userId,
                registrationNo: registrationNo.trim(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                phoneNumber: phoneNumber.trim(),
                role: "STUDENT"
            }
        });

    } catch (error) {

        // -------------------------------------------------
        // Rollback transaction
        // -------------------------------------------------

        if (connection) {
            await connection.rollback();
        }

        console.error(
            "Create student error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create student"
        });

    } finally {

        // -------------------------------------------------
        // Release connection
        // -------------------------------------------------

        if (connection) {
            connection.release();
        }
    }
};


// =====================================================
// GET ALL STUDENTS
// GET /api/students/
// =====================================================

const getStudents = async (req, res) => {

    try {

        const students = await getAllStudents();

        return res.status(200).json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {

        console.error(
            "Get students error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve students"
        });
    }
};


// =====================================================
// GET STUDENT BY ID
// GET /api/students/:id
// =====================================================

const getStudent = async (req, res) => {

    try {

        const studentId = req.params.id;

        const student = await getStudentById(
            studentId
        );

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

        console.error(
            "Get student error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve student"
        });
    }
};


// =====================================================
// UPDATE STUDENT
// PUT /api/students/:id
// =====================================================

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


<<<<<<< HEAD
        // -------------------------------------------------
        // Required field validation
        // -------------------------------------------------

        if (
            !registrationNo ||
            !firstName ||
            !lastName ||
            !email ||
            !phoneNumber
        ) {

=======
        // Validate input data (CR-004)
        const validation = validateStudentData(req.body, true);
        if (!validation.isValid) {
>>>>>>> origin/JFICT16/CR004
            return res.status(400).json({
                success: false,
                message: validation.firstError,
                errors: validation.errors
            });
        }


        // -------------------------------------------------
        // Registration number validation
        // -------------------------------------------------

        if (!registrationNo.trim()) {

            return res.status(400).json({
                success: false,
                message: "Registration number is required"
            });
        }


        // -------------------------------------------------
        // First name validation
        // -------------------------------------------------

        const firstNameError = validateName(
            firstName,
            "First name"
        );

        if (firstNameError) {

            return res.status(400).json({
                success: false,
                message: firstNameError
            });
        }


        // -------------------------------------------------
        // Last name validation
        // -------------------------------------------------

        const lastNameError = validateName(
            lastName,
            "Last name"
        );

        if (lastNameError) {

            return res.status(400).json({
                success: false,
                message: lastNameError
            });
        }


        // -------------------------------------------------
        // Email validation
        // -------------------------------------------------

        const emailError = validateEmail(email);

        if (emailError) {

            return res.status(400).json({
                success: false,
                message: emailError
            });
        }


        // -------------------------------------------------
        // Phone validation
        // -------------------------------------------------

        const phoneError = validatePhoneNumber(
            phoneNumber
        );

        if (phoneError) {

            return res.status(400).json({
                success: false,
                message: phoneError
            });
        }


        // -------------------------------------------------
        // Check student exists
        // -------------------------------------------------

        const existingStudent =
            await getStudentById(studentId);

        if (!existingStudent) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }


        // -------------------------------------------------
        // Update student
        // -------------------------------------------------

        const result = await updateStudent(
            studentId,
            registrationNo.trim(),
            firstName.trim(),
            lastName.trim(),
            email.trim(),
            phoneNumber.trim()
        );


        // -------------------------------------------------
        // Success response
        // -------------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Student updated successfully",

            affectedRows:
                result.affectedRows
        });

    } catch (error) {

<<<<<<< HEAD
        console.error(
            "Update student error:",
            error
        );
=======
        if (error.code === "ER_DUP_ENTRY") {
            const isEmail = error.message && error.message.toLowerCase().includes("email");
            return res.status(409).json({
                success: false,
                message: isEmail ? "Email address is already registered" : "Registration number is already registered"
            });
        }

        console.error("Update student error:", error);
>>>>>>> origin/JFICT16/CR004

        return res.status(500).json({
            success: false,
            message: "Failed to update student"
        });
    }
};


// =====================================================
// DELETE STUDENT
// DELETE /api/students/:id
// =====================================================

const removeStudent = async (req, res) => {

    try {

        const studentId = req.params.id;


        // -------------------------------------------------
        // Check student exists
        // -------------------------------------------------

        const student =
            await getStudentById(studentId);

        if (!student) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }


        // -------------------------------------------------
        // Delete student
        // -------------------------------------------------

        const result =
            await deleteStudent(studentId);


        // -------------------------------------------------
        // Success response
        // -------------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Student deleted successfully",

            affectedRows:
                result.affectedRows
        });

    } catch (error) {

        console.error(
            "Delete student error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to delete student"
        });
    }
};


// =====================================================
// GET CURRENT STUDENT'S OWN PROFILE
// =====================================================

const getMyProfile = async (req, res) => {

    try {

        const student =
            await getStudentByUserId(
                req.user.userId
            );

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

        console.error(
            "Get my profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve profile"
        });
    }
};


// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent
};