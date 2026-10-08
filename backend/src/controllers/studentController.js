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
// CR-004 VALIDATION RULES
// ============================================================

const registrationNumberRegex =
    /^[A-Za-z0-9]+(?:[-/][A-Za-z0-9]+)*$/;

const nameRegex =
    /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const phoneRegex =
    /^\d{10}$/;

const uppercaseRegex =
    /[A-Z]/;

const lowercaseRegex =
    /[a-z]/;

const numberRegex =
    /[0-9]/;

const specialCharacterRegex =
    /[^A-Za-z0-9]/;


// ============================================================
// COMMON STUDENT VALIDATION
// ============================================================

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

    // --------------------------------------------------------
    // Registration Number
    // --------------------------------------------------------

    const trimmedRegistrationNo =
        String(registrationNo || "").trim();

    if (!trimmedRegistrationNo) {

        errors.registrationNo =
            "Registration number is required.";

    } else if (
        !registrationNumberRegex.test(trimmedRegistrationNo)
    ) {

        errors.registrationNo =
            "Registration number contains invalid characters.";
    }


    // --------------------------------------------------------
    // First Name
    // --------------------------------------------------------

    const trimmedFirstName =
        String(firstName || "").trim();

    if (!trimmedFirstName) {

        errors.firstName =
            "First name is required.";

    } else if (trimmedFirstName.length < 3) {

        errors.firstName =
            "First name must contain at least 3 characters.";

    } else if (!nameRegex.test(trimmedFirstName)) {

        errors.firstName =
            "First name can contain only valid alphabetic characters.";
    }


    // --------------------------------------------------------
    // Last Name
    // --------------------------------------------------------

    const trimmedLastName =
        String(lastName || "").trim();

    if (!trimmedLastName) {

        errors.lastName =
            "Last name is required.";

    } else if (trimmedLastName.length < 3) {

        errors.lastName =
            "Last name must contain at least 3 characters.";

    } else if (!nameRegex.test(trimmedLastName)) {

        errors.lastName =
            "Last name can contain only valid alphabetic characters.";
    }


    // --------------------------------------------------------
    // Email
    // --------------------------------------------------------

    const trimmedEmail =
        String(email || "").trim();

    if (!trimmedEmail) {

        errors.email =
            "Email address is required.";

    } else if (!emailRegex.test(trimmedEmail)) {

        errors.email =
            "Please enter a valid email address.";
    }


    // --------------------------------------------------------
    // Phone Number
    // --------------------------------------------------------

    const trimmedPhoneNumber =
        String(phoneNumber || "").trim();

    if (!trimmedPhoneNumber) {

        errors.phoneNumber =
            "Phone number is required.";

    } else if (!/^\d+$/.test(trimmedPhoneNumber)) {

        errors.phoneNumber =
            "Phone number must contain numeric characters only.";

    } else if (!phoneRegex.test(trimmedPhoneNumber)) {

        errors.phoneNumber =
            "Phone number must contain exactly 10 digits.";
    }


    // --------------------------------------------------------
    // Password
    // Password required only while creating a student
    // --------------------------------------------------------

    if (requirePassword) {

        if (!password) {

            errors.password =
                "Password is required for a new student.";

        } else if (password.length < 8) {

            errors.password =
                "Password must contain at least 8 characters.";

        } else if (!uppercaseRegex.test(password)) {

            errors.password =
                "Password must contain at least one uppercase letter.";

        } else if (!lowercaseRegex.test(password)) {

            errors.password =
                "Password must contain at least one lowercase letter.";

        } else if (!numberRegex.test(password)) {

            errors.password =
                "Password must contain at least one number.";

        } else if (!specialCharacterRegex.test(password)) {

            errors.password =
                "Password must contain at least one special character.";
        }
    }


    return errors;
};


// ============================================================
// CREATE STUDENT
// POST /api/students/
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

    let connection = null;

    try {

        // ====================================================
        // CR-004 SERVER-SIDE VALIDATION
        // ====================================================

        const validationErrors =
            validateStudentInput({
                registrationNo,
                firstName,
                lastName,
                email,
                phoneNumber,
                password,
                requirePassword: true
            });


        // If validation fails, stop request
        if (Object.keys(validationErrors).length > 0) {

            return res.status(400).json({
                success: false,
                message:
                    "Please correct the invalid student information.",
                errors: validationErrors
            });
        }


        // ====================================================
        // Trim validated values
        // ====================================================

        const cleanRegistrationNo =
            registrationNo.trim();

        const cleanFirstName =
            firstName.trim();

        const cleanLastName =
            lastName.trim();

        const cleanEmail =
            email.trim();

        const cleanPhoneNumber =
            phoneNumber.trim();


        // ====================================================
        // Get database connection
        // ====================================================

        connection =
            await pool.getConnection();


        // ====================================================
        // Start transaction
        // ====================================================

        await connection.beginTransaction();


        // ====================================================
        // Check duplicate registration number
        // ====================================================

        const [existingUser] =
            await connection.execute(
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
                message:
                    "Registration number is already registered"
            });
        }


        // ====================================================
        // Check duplicate email
        // ====================================================

        const [existingStudent] =
            await connection.execute(
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
                message:
                    "Email address is already registered"
            });
        }


        // ====================================================
        // Hash student password
        // ====================================================

        const passwordHash =
            await bcrypt.hash(password, 10);


        // ====================================================
        // Create user account
        // ====================================================

        const [userResult] =
            await connection.execute(
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


        // ====================================================
        // Create student profile
        // ====================================================

        const studentId =
            await createStudent(
                connection,
                userId,
                cleanRegistrationNo,
                cleanFirstName,
                cleanLastName,
                cleanEmail,
                cleanPhoneNumber
            );


        // ====================================================
        // Commit transaction
        // ====================================================

        await connection.commit();


        // ====================================================
        // Success response
        // ====================================================

        return res.status(201).json({
            success: true,
            message:
                "Student account and profile created successfully",

            student: {
                studentId,
                userId,
                registrationNo:
                    cleanRegistrationNo,
                firstName:
                    cleanFirstName,
                lastName:
                    cleanLastName,
                email:
                    cleanEmail,
                phoneNumber:
                    cleanPhoneNumber,
                role: "STUDENT"
            }
        });


    } catch (error) {

        // Rollback only when connection exists
        if (connection) {

            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Rollback error:",
                    rollbackError
                );
            }
        }


        console.error(
            "Create student error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Failed to create student"
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
// GET /api/students/
// ============================================================

const getStudents = async (req, res) => {

    try {

        const students =
            await getAllStudents();


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
            message:
                "Failed to retrieve students"
        });
    }
};


// ============================================================
// GET STUDENT BY ID
// GET /api/students/:id
// ============================================================

const getStudent = async (req, res) => {

    try {

        const studentId =
            req.params.id;


        const student =
            await getStudentById(studentId);


        if (!student) {

            return res.status(404).json({
                success: false,
                message:
                    "Student not found"
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
            message:
                "Failed to retrieve student"
        });
    }
};


// ============================================================
// UPDATE STUDENT
// PUT /api/students/:id
// ============================================================

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


        // ====================================================
        // CR-004 SERVER-SIDE VALIDATION
        // Password is NOT required during edit
        // ====================================================

        const validationErrors =
            validateStudentInput({
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
                message:
                    "Please correct the invalid student information.",
                errors: validationErrors
            });
        }


        // ====================================================
        // Clean validated values
        // ====================================================

        const cleanRegistrationNo =
            registrationNo.trim();

        const cleanFirstName =
            firstName.trim();

        const cleanLastName =
            lastName.trim();

        const cleanEmail =
            email.trim();

        const cleanPhoneNumber =
            phoneNumber.trim();


        // ====================================================
        // Check student exists
        // ====================================================

        const existingStudent =
            await getStudentById(studentId);


        if (!existingStudent) {

            return res.status(404).json({
                success: false,
                message:
                    "Student not found"
            });
        }


        // ====================================================
        // Update student
        // ====================================================

        const result =
            await updateStudent(
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

        console.error(
            "Update student error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Failed to update student"
        });
    }
};


// ============================================================
// DELETE STUDENT
// DELETE /api/students/:id
// ============================================================

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
                message:
                    "Student not found"
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

        console.error(
            "Delete student error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Failed to delete student"
        });
    }
};


// ============================================================
// GET CURRENT STUDENT PROFILE
// ============================================================

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


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent
};