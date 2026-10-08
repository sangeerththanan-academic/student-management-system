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
// VALIDATION HELPERS
// =====================================================

// Validate registration number
const validateRegistrationNumber = (registrationNo) => {

    if (!registrationNo) {
        return "Registration number is required.";
    }

    if (registrationNo.length < 2) {
        return "Registration number must contain at least 2 characters.";
    }

    // Allows letters, numbers, / and -
    if (!/^[A-Za-z0-9/-]+$/.test(registrationNo)) {
        return "Registration number contains invalid characters.";
    }

    return null;
};


// Validate first name / last name
const validateName = (name, fieldName) => {

    if (!name) {
        return `${fieldName} is required.`;
    }

    if (name.length < 3) {
        return `${fieldName} must contain at least 3 characters.`;
    }

    // Allows alphabetic names with spaces, apostrophe and hyphen
    if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(name)) {
        return `${fieldName} can contain alphabetic characters only.`;
    }

    return null;
};


// Validate email
const validateEmail = (email) => {

    if (!email) {
        return "Email address is required.";
    }

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailRegex.test(email)) {
        return "Please enter a valid email address.";
    }

    return null;
};


// Validate phone number
const validatePhoneNumber = (phoneNumber) => {

    if (!phoneNumber) {
        return "Phone number is required.";
    }

    // Numeric characters only
    if (!/^\d+$/.test(phoneNumber)) {
        return "Phone number must contain numeric characters only.";
    }

    // Exactly 10 digits
    if (phoneNumber.length !== 10) {
        return "Phone number must contain exactly 10 digits.";
    }

    return null;
};


// Validate password
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


// Validate complete student data
const validateStudentFields = ({
    registrationNo,
    firstName,
    lastName,
    email,
    phoneNumber
}) => {

    const errors = {};

    const registrationError =
        validateRegistrationNumber(registrationNo);

    if (registrationError) {
        errors.registrationNo = registrationError;
    }


    const firstNameError =
        validateName(firstName, "First name");

    if (firstNameError) {
        errors.firstName = firstNameError;
    }


    const lastNameError =
        validateName(lastName, "Last name");

    if (lastNameError) {
        errors.lastName = lastNameError;
    }


    const emailError =
        validateEmail(email);

    if (emailError) {
        errors.email = emailError;
    }


    const phoneError =
        validatePhoneNumber(phoneNumber);

    if (phoneError) {
        errors.phoneNumber = phoneError;
    }


    return errors;
};


// =====================================================
// CREATE STUDENT
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

        // Trim input values
        const cleanRegistrationNo =
            registrationNo ? registrationNo.trim() : "";

        const cleanFirstName =
            firstName ? firstName.trim() : "";

        const cleanLastName =
            lastName ? lastName.trim() : "";

        const cleanEmail =
            email ? email.trim() : "";

        const cleanPhoneNumber =
            phoneNumber ? phoneNumber.trim() : "";


        // =================================================
        // SERVER-SIDE STUDENT FIELD VALIDATION
        // =================================================

        const validationErrors = validateStudentFields({
            registrationNo: cleanRegistrationNo,
            firstName: cleanFirstName,
            lastName: cleanLastName,
            email: cleanEmail,
            phoneNumber: cleanPhoneNumber
        });


        // =================================================
        // PASSWORD VALIDATION
        // =================================================

        const passwordError =
            validatePassword(password);

        if (passwordError) {
            validationErrors.password = passwordError;
        }


        // Return validation errors
        if (Object.keys(validationErrors).length > 0) {

            return res.status(400).json({
                success: false,
                message: "Please correct the validation errors.",
                errors: validationErrors
            });
        }


        // =================================================
        // GET DATABASE CONNECTION
        // =================================================

        connection = await pool.getConnection();


        // Start transaction
        await connection.beginTransaction();


        // =================================================
        // CHECK DUPLICATE REGISTRATION NUMBER
        // =================================================

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


        // =================================================
        // CHECK DUPLICATE EMAIL
        // =================================================

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


        // =================================================
        // HASH STUDENT PASSWORD
        // =================================================

        const passwordHash =
            await bcrypt.hash(password, 10);


        // =================================================
        // CREATE USER ACCOUNT
        // =================================================

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


        const userId =
            userResult.insertId;


        // =================================================
        // CREATE STUDENT PROFILE
        // =================================================

        const studentId = await createStudent(
            connection,
            userId,
            cleanRegistrationNo,
            cleanFirstName,
            cleanLastName,
            cleanEmail,
            cleanPhoneNumber
        );


        // =================================================
        // COMMIT TRANSACTION
        // =================================================

        await connection.commit();


        // =================================================
        // SUCCESS RESPONSE
        // =================================================

        return res.status(201).json({
            success: true,
            message:
                "Student account and profile created successfully",

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


// =====================================================
// GET ALL STUDENTS
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
// =====================================================

const getStudent = async (req, res) => {

    try {

        const studentId = req.params.id;

        const student =
            await getStudentById(studentId);


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
// =====================================================

const editStudent = async (req, res) => {

    try {

        const studentId =
            req.params.id;

        const {
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        } = req.body;


        // =================================================
        // CLEAN INPUT
        // =================================================

        const cleanRegistrationNo =
            registrationNo ? registrationNo.trim() : "";

        const cleanFirstName =
            firstName ? firstName.trim() : "";

        const cleanLastName =
            lastName ? lastName.trim() : "";

        const cleanEmail =
            email ? email.trim() : "";

        const cleanPhoneNumber =
            phoneNumber ? phoneNumber.trim() : "";


        // =================================================
        // SERVER-SIDE VALIDATION
        // =================================================

        const validationErrors =
            validateStudentFields({
                registrationNo: cleanRegistrationNo,
                firstName: cleanFirstName,
                lastName: cleanLastName,
                email: cleanEmail,
                phoneNumber: cleanPhoneNumber
            });


        if (Object.keys(validationErrors).length > 0) {

            return res.status(400).json({
                success: false,
                message:
                    "Please correct the validation errors.",
                errors: validationErrors
            });
        }


        // =================================================
        // CHECK STUDENT EXISTS
        // =================================================

        const existingStudent =
            await getStudentById(studentId);


        if (!existingStudent) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }


        // =================================================
        // CHECK DUPLICATE REGISTRATION NUMBER
        // =================================================

        const [existingUser] =
            await pool.execute(
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
                message:
                    "Registration number is already registered"
            });
        }


        // =================================================
        // CHECK DUPLICATE EMAIL
        // =================================================

        const [duplicateEmail] =
            await pool.execute(
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


        if (duplicateEmail.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    "Email address is already registered"
            });
        }


        // =================================================
        // UPDATE STUDENT
        // =================================================

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
            message:
                "Student updated successfully",
            affectedRows:
                result.affectedRows
        });

    } catch (error) {

        console.error("Update student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update student"
        });
    }
};


// =====================================================
// DELETE STUDENT
// =====================================================

const removeStudent = async (req, res) => {

    try {

        const studentId =
            req.params.id;


        // Check student exists
        const student =
            await getStudentById(studentId);


        if (!student) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }


        // Delete student
        const result =
            await deleteStudent(studentId);


        return res.status(200).json({
            success: true,
            message:
                "Student deleted successfully",
            affectedRows:
                result.affectedRows
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
                message:
                    "Student profile not found"
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
            message:
                "Failed to retrieve profile"
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