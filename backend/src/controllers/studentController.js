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

<<<<<<< HEAD
const {
    getPasswordHashByUserId,
    updatePasswordHash
} = require("../models/userModel");
=======
const normalizeStudentValue = (value) => {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
};

const isValidRegistrationNumber = (value) => {
    const normalized = normalizeStudentValue(value);
    return /^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/.test(normalized);
};

const isValidName = (value) => {
    const normalized = normalizeStudentValue(value);
    return normalized.length >= 3 && /^[A-Za-z]+$/.test(normalized);
};

const isValidEmail = (value) => {
    const normalized = normalizeStudentValue(value);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
};

const isValidPhoneNumber = (value) => {
    const normalized = normalizeStudentValue(value);
    return /^\d{10}$/.test(normalized);
};

const isStrongPassword = (value) => {
    if (typeof value !== "string") {
        return false;
    }

    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);
};

const validateStudentPayload = (payload, requirePassword = false) => {
    const registrationNo = normalizeStudentValue(payload.registrationNo);
    const firstName = normalizeStudentValue(payload.firstName);
    const lastName = normalizeStudentValue(payload.lastName);
    const email = normalizeStudentValue(payload.email);
    const phoneNumber = normalizeStudentValue(payload.phoneNumber);
    const password = payload.password;

    if (!registrationNo) {
        return "Registration number is required.";
    }

    if (!isValidRegistrationNumber(registrationNo)) {
        return "Registration number must contain only letters, numbers, hyphen, or underscore.";
    }

    if (!isValidName(firstName)) {
        return "First name must be at least 3 letters and contain only alphabetic characters.";
    }

    if (!isValidName(lastName)) {
        return "Last name must be at least 3 letters and contain only alphabetic characters.";
    }

    if (!isValidEmail(email)) {
        return "Please enter a valid email address.";
    }

    if (!isValidPhoneNumber(phoneNumber)) {
        return "Phone number must contain exactly 10 digits.";
    }

    if (requirePassword) {
        if (!password) {
            return "Password is required for a new student.";
        }

        if (!isStrongPassword(password)) {
            return "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.";
        }
    }

    return "";
};

>>>>>>> origin/JFICT22/CR022

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

    if (!/[^A-Za-z0-9]/.test(password)) {
        return "Password must contain at least one special character";
    }

    return null;
};

// =====================================================
// CREATE STUDENT
// POST /api/students
// =====================================================

<<<<<<< HEAD
const addStudent = async (req, res) => {
=======
    const payload = {
        registrationNo: req.body.registrationNo,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        password: req.body.password
    };

    const validationMessage = validateStudentPayload(payload, true);

    if (validationMessage) {
        return res.status(400).json({
            success: false,
            message: validationMessage
        });
    }

>>>>>>> origin/JFICT22/CR022
    const {
        registrationNo,
        firstName,
        lastName,
        email,
        phoneNumber,
        password
    } = {
        registrationNo: normalizeStudentValue(payload.registrationNo),
        firstName: normalizeStudentValue(payload.firstName),
        lastName: normalizeStudentValue(payload.lastName),
        email: normalizeStudentValue(payload.email),
        phoneNumber: normalizeStudentValue(payload.phoneNumber),
        password: payload.password
    };

    let connection;

    try {
        const validation = validateStudentData(req.body, false);

<<<<<<< HEAD
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.firstError,
                errors: validation.errors
            });
        }

        if (
            typeof registrationNo !== "string" ||
            !registrationNo.trim()
        ) {
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

=======
        // Get database connection
>>>>>>> origin/JFICT22/CR022
        connection = await pool.getConnection();
        await connection.beginTransaction();

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

        const passwordHash = await bcrypt.hash(password, 10);

        const [userResult] = await connection.execute(
            `INSERT INTO users (username, password_hash, role)
             VALUES (?, ?, 'STUDENT')`,
            [registrationNo.trim(), passwordHash]
        );

        const userId = userResult.insertId;

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
                console.error("Transaction rollback error:", rollbackError.message);
            }
        }

        console.error("Create student error:", error.message);

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
        console.error("Get students error:", error.message);

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
        const student = await getStudentById(req.params.id);

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
        console.error("Get student error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve student"
        });
    }
};

// =====================================================
// UPDATE STUDENT PROFILE
// PUT /api/students/:id
// =====================================================

const editStudent = async (req, res) => {
    try {
        const studentId = req.params.id;

        const payload = {
            registrationNo: req.body.registrationNo,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber
        };

        const validationMessage = validateStudentPayload(payload, false);

        if (validationMessage) {
            return res.status(400).json({
                success: false,
                message: validationMessage
            });
        }

        const {
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
<<<<<<< HEAD
        } = req.body;

        const validation = validateStudentData(req.body, true);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.firstError,
                errors: validation.errors
            });
        }
=======
        } = {
            registrationNo: normalizeStudentValue(payload.registrationNo),
            firstName: normalizeStudentValue(payload.firstName),
            lastName: normalizeStudentValue(payload.lastName),
            email: normalizeStudentValue(payload.email),
            phoneNumber: normalizeStudentValue(payload.phoneNumber)
        };
>>>>>>> origin/JFICT22/CR022

        if (
            typeof registrationNo !== "string" ||
            !registrationNo.trim()
        ) {
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
        console.error("Update student error:", error.message);

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
        console.error("Delete student error:", error.message);

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
        console.error("Get my profile error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve profile"
        });
    }
};

// =====================================================
// CR-020: CHANGE LOGGED-IN STUDENT PASSWORD
// PATCH /api/students/me/password
// =====================================================

const changeMyPassword = async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body || {};

        if (
            typeof currentPassword !== "string" ||
            !currentPassword ||
            typeof newPassword !== "string" ||
            !newPassword ||
            typeof confirmPassword !== "string" ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required"
            });
        }

        const passwordError = validatePassword(newPassword);

        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirmation password do not match"
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password"
            });
        }

        // Never trust a user ID sent by the frontend.
        const userId = req.user.userId;

        const account = await getPasswordHashByUserId(userId);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Student account not found"
            });
        }

        const currentPasswordMatches = await bcrypt.compare(
            currentPassword,
            account.password_hash
        );

        if (!currentPasswordMatches) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        const result = await updatePasswordHash(
            userId,
            newPasswordHash
        );

        if (!result.affectedRows) {
            return res.status(500).json({
                success: false,
                message: "Password could not be updated"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        // Do not log passwords or password hashes.
        console.error("Change student password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to change password"
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
    removeStudent,
    changeMyPassword
};