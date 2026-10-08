
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


// ============================================================
// CR-004 VALIDATION HELPERS
// ============================================================

// Registration number validation
const validateRegistrationNo = (registrationNo) => {
    if (!registrationNo || !registrationNo.trim()) {
        return "Registration number is required.";
    }

    if (!/^[A-Za-z0-9/-]+$/.test(registrationNo.trim())) {
        return "Registration number can contain only letters, numbers, hyphens, and slashes.";
    }

    return null;
};


// First name validation
const validateFirstName = (firstName) => {
    if (!firstName || !firstName.trim()) {
        return "First name is required.";
    }

    const value = firstName.trim();

    if (value.length < 3) {
        return "First name must contain at least 3 characters.";
    }

    if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(value)) {
        return "First name can contain only valid alphabetic characters.";
    }

    return null;
};


// Last name validation
const validateLastName = (lastName) => {
    if (!lastName || !lastName.trim()) {
        return "Last name is required.";
    }

    const value = lastName.trim();

    if (value.length < 3) {
        return "Last name must contain at least 3 characters.";
    }

    if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(value)) {
        return "Last name can contain only valid alphabetic characters.";
    }

    return null;
};


// Email validation
const validateEmail = (email) => {
    if (!email || !email.trim()) {
        return "Email address is required.";
    }

    const value = email.trim();

    if (
        !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)
    ) {
        return "Please enter a valid email address.";
    }

    return null;
};


// Phone validation
const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber || !phoneNumber.trim()) {
        return "Phone number is required.";
    }

    const value = phoneNumber.trim();

    if (!/^\d+$/.test(value)) {
        return "Phone number must contain numeric characters only.";
    }

    if (value.length !== 10) {
        return "Phone number must contain exactly 10 digits.";
    }

    return null;
};


// Strong password validation
const validatePassword = (password) => {
    if (!password) {
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

    return null;
};


// Validate all student fields
const validateStudentFields = ({
    registrationNo,
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
    requirePassword = false
}) => {

    const errors = {};

    const registrationError = validateRegistrationNo(registrationNo);

    if (registrationError) {
        errors.registrationNo = registrationError;
    }


    const firstNameError = validateFirstName(firstName);

    if (firstNameError) {
        errors.firstName = firstNameError;
    }


    const lastNameError = validateLastName(lastName);

    if (lastNameError) {
        errors.lastName = lastNameError;
    }


    const emailError = validateEmail(email);

    if (emailError) {
        errors.email = emailError;
    }


    const phoneError = validatePhoneNumber(phoneNumber);

    if (phoneError) {
        errors.phoneNumber = phoneError;
    }


    if (requirePassword) {
        const passwordError = validatePassword(password);

        if (passwordError) {
            errors.password = passwordError;
        }
    }


    return errors;
};


// ============================================================
// CREATE STUDENT
// ============================================================

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

        // ----------------------------------------------------
        // CR-004 SERVER-SIDE VALIDATION
        // ----------------------------------------------------

        const validationErrors = validateStudentFields({
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
                message: "Validation failed. Please correct the provided student information.",
                errors: validationErrors
            });
        }


        // Trim normal input values after validation
        const cleanRegistrationNo = registrationNo.trim();
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim();
        const cleanPhoneNumber = phoneNumber.trim();


        // ----------------------------------------------------
        // GET DATABASE CONNECTION
        // ----------------------------------------------------

        connection = await pool.getConnection();


        // Start transaction
        await connection.beginTransaction();


        // ----------------------------------------------------
        // CHECK DUPLICATE REGISTRATION NUMBER
        // ----------------------------------------------------

        const [existingUser] = await connection.execute(
            `SELECT user_id
             FROM users
             WHERE username = ?
             LIMIT 1`,
            [cleanRegistrationNo]
        );


        if (existingUser.length > 0) {

            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered"
            });
        }


        // ----------------------------------------------------
        // CHECK DUPLICATE EMAIL
        // ----------------------------------------------------

        const [existingStudent] = await connection.execute(
            `SELECT student_id
             FROM students
             WHERE email = ?
             LIMIT 1`,
            [cleanEmail]
        );


        if (existingStudent.length > 0) {

            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Email address is already registered"
            });
        }


        // ----------------------------------------------------
        // HASH STUDENT PASSWORD
        // ----------------------------------------------------

        const passwordHash = await bcrypt.hash(password, 10);


        // ----------------------------------------------------
        // CREATE USER ACCOUNT
        // ----------------------------------------------------

        const [userResult] = await connection.execute(
            `INSERT INTO users
            (
                username,
                password_hash,
                role
            )
            VALUES (?, ?, 'STUDENT')`,
            [
                cleanRegistrationNo,
                passwordHash
            ]
        );


        const userId = userResult.insertId;


        // ----------------------------------------------------
        // CREATE STUDENT PROFILE
        // ----------------------------------------------------

        const studentId = await createStudent(
            connection,
            userId,
            cleanRegistrationNo,
            cleanFirstName,
            cleanLastName,
            cleanEmail,
            cleanPhoneNumber
        );


        // ----------------------------------------------------
        // COMMIT TRANSACTION
        // ----------------------------------------------------

        await connection.commit();


        // ----------------------------------------------------
        // SUCCESS RESPONSE
        // ----------------------------------------------------

        return res.status(201).json({
            success: true,
            message: "Student account and profile created successfully",
            student: {
                studentId,
                userId,
                registrationNo: cleanRegistrationNo,
                firstName: cleanFirstName,
                lastName: cleanLastName,
                email: cleanEmail,
                phoneNumber: cleanPhoneNumber,
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


// ============================================================
// GET ALL STUDENTS
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
            message: "Failed to retrieve students"
        });
    }
};


// ============================================================
// GET STUDENT BY ID
// ============================================================

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


// ============================================================
// UPDATE STUDENT
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
        } = req.body;


        // ----------------------------------------------------
        // CR-004 SERVER-SIDE VALIDATION
        // ----------------------------------------------------

        const validationErrors = validateStudentFields({
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
                message: "Validation failed. Please correct the provided student information.",
                errors: validationErrors
            });
        }


        // Clean values
        const cleanRegistrationNo = registrationNo.trim();
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim();
        const cleanPhoneNumber = phoneNumber.trim();


        // ----------------------------------------------------
        // CHECK STUDENT EXISTS
        // ----------------------------------------------------

        const existingStudent = await getStudentById(studentId);

        if (!existingStudent) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }


        // ----------------------------------------------------
        // CHECK DUPLICATE REGISTRATION NUMBER
        // ----------------------------------------------------

        const [existingUser] = await pool.execute(
            `SELECT user_id
             FROM users
             WHERE username = ?
             AND user_id != ?
             LIMIT 1`,
            [
                cleanRegistrationNo,
                existingStudent.user_id
            ]
        );


        if (existingUser.length > 0) {

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered"
            });
        }


        // ----------------------------------------------------
        // CHECK DUPLICATE EMAIL
        // ----------------------------------------------------

        const [existingEmail] = await pool.execute(
            `SELECT student_id
             FROM students
             WHERE email = ?
             AND student_id != ?
             LIMIT 1`,
            [
                cleanEmail,
                studentId
            ]
        );


        if (existingEmail.length > 0) {

            return res.status(409).json({
                success: false,
                message: "Email address is already registered"
            });
        }


        // ----------------------------------------------------
        // UPDATE STUDENT
        // ----------------------------------------------------

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


// ============================================================
// DELETE STUDENT
// ============================================================

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


// ============================================================
// GET CURRENT STUDENT'S OWN PROFILE
// ============================================================

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


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent
};

