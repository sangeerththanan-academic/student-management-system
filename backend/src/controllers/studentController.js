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

// =====================================================
// STUDENT INPUT VALIDATION
// =====================================================

const validateStudentInput = ({
    registrationNo,
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
    requirePassword = false
}) => {
    const errors = {};

    const registration =
        typeof registrationNo === "string"
            ? registrationNo.trim()
            : "";

    const first =
        typeof firstName === "string"
            ? firstName.trim()
            : "";

    const last =
        typeof lastName === "string"
            ? lastName.trim()
            : "";

    const emailValue =
        typeof email === "string"
            ? email.trim()
            : "";

    const phone =
        typeof phoneNumber === "string"
            ? phoneNumber.trim()
            : "";

    // Registration number validation
    if (!registration) {
        errors.registrationNo =
            "Registration number is required.";
    } else if (!/^[A-Za-z0-9/_-]+$/.test(registration)) {
        errors.registrationNo =
            "Registration number contains invalid characters.";
    }

    // Name validation
    const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

    if (!first) {
        errors.firstName = "First name is required.";
    } else if (first.length < 3) {
        errors.firstName =
            "First name must contain at least 3 characters.";
    } else if (!nameRegex.test(first)) {
        errors.firstName =
            "First name contains invalid characters.";
    }

    if (!last) {
        errors.lastName = "Last name is required.";
    } else if (last.length < 3) {
        errors.lastName =
            "Last name must contain at least 3 characters.";
    } else if (!nameRegex.test(last)) {
        errors.lastName =
            "Last name contains invalid characters.";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValue) {
        errors.email = "Email address is required.";
    } else if (!emailRegex.test(emailValue)) {
        errors.email = "Please provide a valid email address.";
    }

    // Phone number validation
    if (!phone) {
        errors.phoneNumber = "Phone number is required.";
    } else if (!/^\d+$/.test(phone)) {
        errors.phoneNumber =
            "Phone number must contain numbers only.";
    } else if (phone.length !== 10) {
        errors.phoneNumber =
            "Phone number must contain exactly 10 digits.";
    }

    // Password validation (student creation only)
    if (requirePassword) {
        if (typeof password !== "string" || !password) {
            errors.password =
                "Password is required for a new student.";
        } else if (password.length < 8) {
            errors.password =
                "Password must contain at least 8 characters.";
        } else if (!/[A-Z]/.test(password)) {
            errors.password =
                "Password must contain at least one uppercase letter.";
        } else if (!/[a-z]/.test(password)) {
            errors.password =
                "Password must contain at least one lowercase letter.";
        } else if (!/[0-9]/.test(password)) {
            errors.password =
                "Password must contain at least one number.";
        } else if (!/[^A-Za-z0-9]/.test(password)) {
            errors.password =
                "Password must contain at least one special character.";
        }
    }

    return errors;
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
        const validationErrors = validateStudentInput({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            requirePassword: true
        });

        if (Object.keys(validationErrors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Please correct the validation errors.",
                errors: validationErrors
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
                message: "Registration number is already registered."
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
                message: "Email address is already registered."
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
        // This assumes createStudent accepts these arguments.
        const studentId = await createStudent(
            connection,
            userId,
            registrationNo.trim(),
            firstName.trim(),
            lastName.trim(),
            email.trim(),
            phoneNumber.trim()
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Student account and profile created successfully.",
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
        if (connection) {
            await connection.rollback();
        }

        console.error("Create student error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "Registration number or email is already registered."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create student."
        });
    } finally {
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
        console.error("Get students error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve students."
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
                message: "Student not found."
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
            message: "Failed to retrieve student."
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

        const validationErrors = validateStudentInput({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            requirePassword: false
        });

        if (Object.keys(validationErrors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Please correct the validation errors.",
                errors: validationErrors
            });
        }

        const existingStudent = await getStudentById(studentId);

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        // Duplicate arguments removed
        const result = await updateStudent(
            studentId,
            registrationNo.trim(),
            firstName.trim(),
            lastName.trim(),
            email.trim(),
            phoneNumber.trim()
        );

        if (result && result.affectedRows === 0) {
            return res.status(200).json({
                success: true,
                message: "No student data changes were needed.",
                affectedRows: 0
            });
        }

        return res.status(200).json({
            success: true,
            message: "Student updated successfully.",
            affectedRows: result.affectedRows
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            const message =
                error.message?.toLowerCase().includes("email")
                    ? "Email address is already registered."
                    : "Registration number is already registered.";

            return res.status(409).json({
                success: false,
                message
            });
        }

        console.error("Update student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update student."
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
                message: "Student not found."
            });
        }

        const result = await deleteStudent(studentId);

        return res.status(200).json({
            success: true,
            message: "Student deleted successfully.",
            affectedRows: result.affectedRows
        });
    } catch (error) {
        console.error("Delete student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete student."
        });
    }
};

// =====================================================
// GET CURRENT STUDENT'S OWN PROFILE
// GET /api/students/me
// =====================================================

const getMyProfile = async (req, res) => {
    try {
        // Assumes authenticate middleware sets req.user.userId
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user ID is missing."
            });
        }

        const student = await getStudentByUserId(userId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found."
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
            message: "Failed to retrieve profile."
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
