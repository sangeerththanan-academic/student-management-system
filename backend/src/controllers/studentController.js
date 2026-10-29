const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    updateStudent,
    updateMyProfile,
    deleteStudent
} = require("../models/studentModel");

// ============================================================
// VALIDATION FUNCTION
// Used by CREATE and ADMIN UPDATE
// ============================================================

const validateStudentInput = ({
    registrationNo,
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
    isCreating = false
}) => {
    const registration = String(registrationNo ?? "").trim();
    const first = String(firstName ?? "").trim();
    const last = String(lastName ?? "").trim();
    const emailValue = String(email ?? "").trim();
    const phone = String(phoneNumber ?? "").trim();

    if (!registration) {
        return "Registration number is required.";
    }

    if (!first) {
        return "First name is required.";
    }

    if (!last) {
        return "Last name is required.";
    }

    if (!emailValue) {
        return "Email address is required.";
    }

    if (!phone) {
        return "Phone number is required.";
    }

    const registrationPattern = /^[A-Za-z0-9/-]+$/;

    if (!registrationPattern.test(registration)) {
        return "Registration number contains invalid characters.";
    }

    const namePattern = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

    if (first.length < 3 || !namePattern.test(first)) {
        return "First name must contain at least 3 valid alphabetic characters.";
    }

    if (last.length < 3 || !namePattern.test(last)) {
        return "Last name must contain at least 3 valid alphabetic characters.";
    }

    const emailPattern =
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailPattern.test(emailValue)) {
        return "Please enter a valid email address.";
    }

    if (!/^\d{10}$/.test(phone)) {
        return "Phone number must contain exactly 10 digits.";
    }

    if (isCreating) {
        if (typeof password !== "string" || !password) {
            return "Password is required for a new student.";
        }

        if (password.length < 8) {
            return "Password must contain at least 8 characters.";
        }

        if (!/[A-Z]/.test(password)) {
            return "Password must contain at least one uppercase letter.";
        }

        if (!/[a-z]/.test(password)) {
            return "Password must contain at least one lowercase letter.";
        }

        if (!/[0-9]/.test(password)) {
            return "Password must contain at least one number.";
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            return "Password must contain at least one special character.";
        }
    }

    return null;
};

// ============================================================
// CREATE STUDENT
// POST /api/students
// ============================================================

const addStudent = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const {
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            password
        } = req.body || {};

        const validationError = validateStudentInput({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            isCreating: true
        });

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const cleanRegistrationNo = String(registrationNo).trim();
        const cleanFirstName = String(firstName).trim();
        const cleanLastName = String(lastName).trim();
        const cleanEmail = String(email).trim();
        const cleanPhoneNumber = String(phoneNumber).trim();

        connection = await pool.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // Check duplicate username / registration number
        const [existingUser] = await connection.execute(
            `SELECT user_id
             FROM users
             WHERE username = ?
             LIMIT 1`,
            [cleanRegistrationNo]
        );

        if (existingUser.length > 0) {
            await connection.rollback();
            transactionStarted = false;

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
            [cleanEmail]
        );

        if (existingStudent.length > 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(409).json({
                success: false,
                message: "Email address is already registered."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Create user account
        const [userResult] = await connection.execute(
            `INSERT INTO users
                (username, password_hash, role)
             VALUES (?, ?, 'STUDENT')`,
            [cleanRegistrationNo, passwordHash]
        );

        const userId = userResult.insertId;

        // Create student profile
        const studentId = await createStudent(
            connection,
            userId,
            cleanRegistrationNo,
            cleanFirstName,
            cleanLastName,
            cleanEmail,
            cleanPhoneNumber
        );

        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            success: true,
            message: "Student account and profile created successfully.",
            student: {
                student_id: studentId,
                user_id: userId,
                registration_no: cleanRegistrationNo,
                first_name: cleanFirstName,
                last_name: cleanLastName,
                email: cleanEmail,
                phone_number: cleanPhoneNumber
            }
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Create student rollback error:", rollbackError);
            }
        }

        console.error("Create student error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Registration number or email is already registered."
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

// ============================================================
// GET ALL STUDENTS
// GET /api/students
// ============================================================

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

// ============================================================
// GET STUDENT BY ID
// GET /api/students/:id
// ============================================================

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

// ============================================================
// ADMIN: UPDATE STUDENT
// PUT /api/students/:id
// ============================================================

const editStudent = async (req, res) => {
    try {
        const studentId = req.params.id;

        const {
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        } = req.body || {};

        const validationError = validateStudentInput({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            isCreating: false
        });

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const cleanRegistrationNo = String(registrationNo).trim();
        const cleanFirstName = String(firstName).trim();
        const cleanLastName = String(lastName).trim();
        const cleanEmail = String(email).trim();
        const cleanPhoneNumber = String(phoneNumber).trim();

        const existingStudent = await getStudentById(studentId);

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        // Check duplicate registration number
        const [existingRegistration] = await pool.execute(
            `SELECT student_id
             FROM students
             WHERE registration_no = ?
               AND student_id <> ?
             LIMIT 1`,
            [cleanRegistrationNo, studentId]
        );

        if (existingRegistration.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Registration number is already registered."
            });
        }

        // Check duplicate email
        const [existingEmail] = await pool.execute(
            `SELECT student_id
             FROM students
             WHERE email = ?
               AND student_id <> ?
             LIMIT 1`,
            [cleanEmail, studentId]
        );

        if (existingEmail.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email address is already registered."
            });
        }

        const result = await updateStudent(
            studentId,
            cleanRegistrationNo,
            cleanFirstName,
            cleanLastName,
            cleanEmail,
            cleanPhoneNumber
        );

        return res.status(200).json({
            success: true,
            message: "Student updated successfully.",
            affectedRows: result.affectedRows
        });
    } catch (error) {
        console.error("Update student error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Registration number or email is already registered."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update student."
        });
    }
};

// ============================================================
// DELETE STUDENT
// DELETE /api/students/:id
// ============================================================

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

// ============================================================
// GET CURRENT STUDENT PROFILE
// GET /api/students/me
// ============================================================

const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
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

// ============================================================
// CR-019: UPDATE CURRENT STUDENT PROFILE
// PUT /api/students/me
// Only email and phone_number can be updated
// ============================================================

const updateMyProfileController = async (req, res) => {
    try {
        // Use the authenticated user's ID, not an ID from the request body.
        const userId = req.user.userId;

        const { email, phone_number } = req.body || {};

        if (
            typeof email !== "string" ||
            typeof phone_number !== "string" ||
            !email.trim() ||
            !phone_number.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Email address and phone number are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone_number.trim();

        // Email validation
        const emailPattern =
            /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        if (!emailPattern.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        // Phone must contain exactly 10 digits
        if (!/^\d{10}$/.test(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message: "Phone number must contain exactly 10 digits."
            });
        }

        // Confirm the authenticated user has a student profile
        const currentStudent = await getStudentByUserId(userId);

        if (!currentStudent) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found."
            });
        }

        // Prevent using another student's email
        const [existingEmail] = await pool.execute(
            `SELECT student_id
             FROM students
             WHERE email = ?
               AND user_id <> ?
             LIMIT 1`,
            [cleanEmail, userId]
        );

        if (existingEmail.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email address is already registered."
            });
        }

        // Update only email and phone for the authenticated user
        await updateMyProfile(
            userId,
            cleanEmail,
            cleanPhone
        );

        // Return the updated profile
        const updatedStudent = await getStudentByUserId(userId);

        if (!updatedStudent) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found after update."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            student: updatedStudent
        });
    } catch (error) {
        console.error("Update my profile error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Email address is already registered."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update profile. Please try again."
        });
    }
};

// ============================================================
// EXPORT CONTROLLER FUNCTIONS
// ============================================================

module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    updateMyProfileController,
    editStudent,
    removeStudent
};

