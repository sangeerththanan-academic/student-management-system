
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

const validateName = (name, fieldName) => {
    if (typeof name !== "string" || !name.trim()) {
        return `${fieldName} is required`;
    }

    if (name.trim().length < 3) {
        return `${fieldName} must contain at least 3 characters`;
    }

    if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name.trim())) {
        return `${fieldName} must contain only letters and spaces`;
    }

    return null;
};

const validateEmail = (email) => {
    if (typeof email !== "string" || !email.trim()) {
        return "Email address is required";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return "Please enter a valid email address";
    }

    return null;
};

const validatePhoneNumber = (phoneNumber) => {
    const phone = String(phoneNumber ?? "").trim();

    if (!phone) {
        return "Phone number is required";
    }

    if (!/^\d{10}$/.test(phone)) {
        return "Phone number must contain exactly 10 digits";
    }

    return null;
};

const validatePassword = (password) => {
    if (typeof password !== "string" || !password) {
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
// POST /api/students
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
        // Validate required fields and CR-004 rules
        const validation = validateStudentData(req.body, false);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.firstError,
                errors: validation.errors
            });
        }

        if (typeof registrationNo !== "string" || !registrationNo.trim()) {
            return res.status(400).json({
                success: false,
                message: "Registration number is required"
            });
        }

        const firstNameError = validateName(firstName, "First name");

        if (firstNameError) {
            return res.status(400).json({
                success: false,
                message: firstNameError
            });
        }

        const lastNameError = validateName(lastName, "Last name");

        if (lastNameError) {
            return res.status(400).json({
                success: false,
                message: lastNameError
            });
        }

        const emailError = validateEmail(email);

        if (emailError) {
            return res.status(400).json({
                success: false,
                message: emailError
            });
        }

        const phoneError = validatePhoneNumber(phoneNumber);

        if (phoneError) {
            return res.status(400).json({
                success: false,
                message: phoneError
            });
        }

        const passwordError = validatePassword(password);

        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Check duplicate registration number
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

        // Check duplicate email
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

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user account
        const [userResult] = await connection.execute(
            `INSERT INTO users
                (username, password_hash, role)
             VALUES (?, ?, 'STUDENT')`,
            [registrationNo.trim(), passwordHash]
        );

        const userId = userResult.insertId;

        // Create student profile
        const studentId = await createStudent(
            connection,
            userId,
            registrationNo.trim(),
            firstName.trim(),
            lastName.trim(),
            email.trim(),
            String(phoneNumber).trim()
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Student account and profile created successfully",
            student: {
                studentId,
                userId,
                registrationNo: registrationNo.trim(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                phoneNumber: String(phoneNumber).trim(),
                role: "STUDENT"
            }
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Transaction rollback error:", rollbackError);
            }
        }

        console.error("Create student error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Registration number or email is already registered"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create student"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// =====================================================
// GET ALL STUDENTS
// GET /api/students
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
        console.error("Get students error:", error);

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

        // Validate update data
        const validation = validateStudentData(req.body, true);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.firstError,
                errors: validation.errors
            });
        }

        if (typeof registrationNo !== "string" || !registrationNo.trim()) {
            return res.status(400).json({
                success: false,
                message: "Registration number is required"
            });
        }

        const firstNameError = validateName(firstName, "First name");

        if (firstNameError) {
            return res.status(400).json({
                success: false,
                message: firstNameError
            });
        }

        const lastNameError = validateName(lastName, "Last name");

        if (lastNameError) {
            return res.status(400).json({
                success: false,
                message: lastNameError
            });
        }

        const emailError = validateEmail(email);

        if (emailError) {
            return res.status(400).json({
                success: false,
                message: emailError
            });
        }

        const phoneError = validatePhoneNumber(phoneNumber);

        if (phoneError) {
            return res.status(400).json({
                success: false,
                message: phoneError
            });
        }

        const existingStudent = await getStudentById(studentId);

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const result = await updateStudent(
            studentId,
            registrationNo.trim(),
            firstName.trim(),
            lastName.trim(),
            email.trim(),
            String(phoneNumber).trim()
        );

        return res.status(200).json({
            success: true,
            message: "Student updated successfully",
            affectedRows: result.affectedRows
        });
    } catch (error) {
        console.error("Update student error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Email address or registration number is already registered"
            });
        }

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
        const student = await getStudentById(studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

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

// =====================================================
// GET LOGGED-IN STUDENT PROFILE
// GET /api/students/me
// =====================================================

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