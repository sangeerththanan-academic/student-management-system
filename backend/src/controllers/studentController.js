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


// ============================================================
// VALIDATION
// ============================================================

const validateStudentInput = ({
    registrationNo,
    firstName,
    lastName,
    email,
    phoneNumber,
    password
}, requirePassword = false) => {

    const errors = {};

    const registration = String(
        registrationNo || ""
    ).trim();

    const first = String(
        firstName || ""
    ).trim();

    const last = String(
        lastName || ""
    ).trim();

    const emailAddress = String(
        email || ""
    ).trim();

    const phone = String(
        phoneNumber || ""
    ).trim();


    // --------------------------------------------------------
    // Registration Number
    // --------------------------------------------------------

    if (!registration) {

        errors.registrationNo =
            "Registration number is required.";

    } else if (
        !/^[A-Za-z0-9-]+$/.test(registration)
    ) {

        errors.registrationNo =
            "Registration number can contain only letters, numbers and hyphens.";
    }


    // --------------------------------------------------------
    // First Name
    // --------------------------------------------------------

    if (!first) {

        errors.firstName =
            "First name is required.";

    } else if (first.length < 3) {

        errors.firstName =
            "First name must contain at least 3 characters.";

    } else if (
        !/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(first)
    ) {

        errors.firstName =
            "First name contains invalid characters.";
    }


    // --------------------------------------------------------
    // Last Name
    // --------------------------------------------------------

    if (!last) {

        errors.lastName =
            "Last name is required.";

    } else if (last.length < 3) {

        errors.lastName =
            "Last name must contain at least 3 characters.";

    } else if (
        !/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(last)
    ) {

        errors.lastName =
            "Last name contains invalid characters.";
    }


    // --------------------------------------------------------
    // Email
    // --------------------------------------------------------

    if (!emailAddress) {

        errors.email =
            "Email address is required.";

    } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)
    ) {

        errors.email =
            "Please enter a valid email address.";
    }


    // --------------------------------------------------------
    // Phone Number
    // --------------------------------------------------------

    if (!phone) {

        errors.phoneNumber =
            "Phone number is required.";

    } else if (!/^\d+$/.test(phone)) {

        errors.phoneNumber =
            "Phone number must contain numeric characters only.";

    } else if (phone.length !== 10) {

        errors.phoneNumber =
            "Phone number must contain exactly 10 digits.";
    }


    // --------------------------------------------------------
    // Password
    // --------------------------------------------------------

    if (requirePassword) {

        if (!password) {

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

        } else if (
            !/[!@#$%^&*(),.?":{}|<>_\-\\[\]\/';+=~`]/.test(password)
        ) {

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

    let connection;

    try {

        // ----------------------------------------------------
        // Server-side validation
        // ----------------------------------------------------

        const validationErrors = validateStudentInput(
            {
                registrationNo,
                firstName,
                lastName,
                email,
                phoneNumber,
                password
            },
            true
        );


        if (Object.keys(validationErrors).length > 0) {

            return res.status(400).json({
                success: false,
                message:
                    Object.values(validationErrors)[0],
                errors: validationErrors
            });
        }


        // ----------------------------------------------------
        // Get database connection
        // ----------------------------------------------------

        connection = await pool.getConnection();


        // Start transaction
        await connection.beginTransaction();


        // ----------------------------------------------------
        // Check duplicate registration number
        // ----------------------------------------------------

        const [existingUser] =
            await connection.execute(
                `SELECT user_id
                 FROM users
                 WHERE username = ?
                 LIMIT 1`,
                [
                    registrationNo.trim()
                ]
            );


        if (existingUser.length > 0) {

            await connection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "Registration number is already registered"
            });
        }


        // ----------------------------------------------------
        // Check duplicate email
        // ----------------------------------------------------

        const [existingStudent] =
            await connection.execute(
                `SELECT student_id
                 FROM students
                 WHERE email = ?
                 LIMIT 1`,
                [
                    email.trim()
                ]
            );


        if (existingStudent.length > 0) {

            await connection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "Email address is already registered"
            });
        }


        // ----------------------------------------------------
        // Hash password
        // ----------------------------------------------------

        const passwordHash =
            await bcrypt.hash(password, 10);


        // ----------------------------------------------------
        // Create user account
        // ----------------------------------------------------

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
                    registrationNo.trim(),
                    passwordHash
                ]
            );


        const userId =
            userResult.insertId;


        // ----------------------------------------------------
        // Create student profile
        // ----------------------------------------------------

        const studentId =
            await createStudent(
                connection,
                userId,
                registrationNo.trim(),
                firstName.trim(),
                lastName.trim(),
                email.trim(),
                phoneNumber.trim()
            );


        // ----------------------------------------------------
        // Commit transaction
        // ----------------------------------------------------

        await connection.commit();


        // ----------------------------------------------------
        // Success response
        // ----------------------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Student account and profile created successfully",

            student: {
                studentId,
                userId,
                registrationNo:
                    registrationNo.trim(),
                firstName:
                    firstName.trim(),
                lastName:
                    lastName.trim(),
                email:
                    email.trim(),
                phoneNumber:
                    phoneNumber.trim(),
                role: "STUDENT"
            }
        });


    } catch (error) {

        // Rollback if transaction started
        if (connection) {

            await connection.rollback();
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


        // ----------------------------------------------------
        // Server-side validation for edit
        // ----------------------------------------------------

        const validationErrors =
            validateStudentInput(
                {
                    registrationNo,
                    firstName,
                    lastName,
                    email,
                    phoneNumber
                },
                false
            );


        if (Object.keys(validationErrors).length > 0) {

            return res.status(400).json({

                success: false,

                message:
                    Object.values(validationErrors)[0],

                errors:
                    validationErrors
            });
        }


        // ----------------------------------------------------
        // Check student exists
        // ----------------------------------------------------

        const existingStudent =
            await getStudentById(studentId);


        if (!existingStudent) {

            return res.status(404).json({

                success: false,

                message:
                    "Student not found"
            });
        }


        // ----------------------------------------------------
        // Update student
        // ----------------------------------------------------

        const result =
            await updateStudent(
                studentId,
                registrationNo.trim(),
                firstName.trim(),
                lastName.trim(),
                email.trim(),
                phoneNumber.trim()
            );


        return res.status(200).json({

            success: true,

            message:
                "Student updated successfully",

            affectedRows:
                result.affectedRows
        });


    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {
            const isEmail = error.message && error.message.toLowerCase().includes("email");
            return res.status(409).json({
                success: false,
                message: isEmail ? "Email address is already registered" : "Registration number is already registered"
            });
        }

        console.error(
            "Update student error:",
            error
        );


        // Handle duplicate database values
        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({

                success: false,

                message:
                    "Registration number or email address is already registered."
            });
        }


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