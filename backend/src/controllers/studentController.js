
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

// Store a URL path that Express exposes for uploaded student images.
const getProfilePhotoPath = (req) => {
    return req.file
        ? `/Uploads/student/${req.file.filename}`
        : undefined;
};

// CR-004: Student Input Validation
const validateStudentInput = ({
    registrationNo,
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
    isCreating
}) => {
    const errors = {};

    // Registration number
    if (
        typeof registrationNo !== "string" ||
        !registrationNo.trim()
    ) {
        errors.registrationNo = "Registration number is required.";
    } else if (!/^REG\d{3}$/.test(registrationNo.trim())) {
        errors.registrationNo =
            "Registration number must be in the format REG001.";
    }

    // First name
    if (
        typeof firstName !== "string" ||
        !firstName.trim()
    ) {
        errors.firstName = "First name is required.";
    } else if (firstName.trim().length < 3) {
        errors.firstName =
            "First name must contain at least 3 characters.";
    } else if (!/^[A-Za-z]+$/.test(firstName.trim())) {
        errors.firstName =
            "First name can contain only alphabetic characters.";
    }

    // Last name
    if (
        typeof lastName !== "string" ||
        !lastName.trim()
    ) {
        errors.lastName = "Last name is required.";
    } else if (lastName.trim().length < 3) {
        errors.lastName =
            "Last name must contain at least 3 characters.";
    } else if (!/^[A-Za-z]+$/.test(lastName.trim())) {
        errors.lastName =
            "Last name can contain only alphabetic characters.";
    }

    // Email
    if (
        typeof email !== "string" ||
        !email.trim()
    ) {
        errors.email = "Email address is required.";
    } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
        errors.email = "Please enter a valid email address.";
    }

    // Phone number
    if (
        typeof phoneNumber !== "string" ||
        !phoneNumber.trim()
    ) {
        errors.phoneNumber = "Phone number is required.";
    } else if (!/^\d{10}$/.test(phoneNumber.trim())) {
        errors.phoneNumber =
            "Phone number must contain exactly 10 digits.";
    }

    // Password validation: Add Student only
    if (isCreating) {
        if (
            typeof password !== "string" ||
            !password
        ) {
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

// CREATE STUDENT
// POST /api/students/
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
            isCreating: true
        });

        if (Object.keys(validationErrors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Please correct the validation errors.",
                errors: validationErrors
            });
        }

        const normalizedRegistrationNo = registrationNo.trim();
        const normalizedFirstName = firstName.trim();
        const normalizedLastName = lastName.trim();
        const normalizedEmail = email.trim();
        const normalizedPhoneNumber = phoneNumber.trim();

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Check duplicate username / registration number
        const [existingUser] = await connection.execute(
            `SELECT user_id
             FROM users
             WHERE username = ?
             LIMIT 1`,
            [normalizedRegistrationNo]
        );

        if (existingUser.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered",
                errors: {
                    registrationNo:
                        "Registration number is already registered."
                }
            });
        }

        // Check duplicate email
        const [existingStudent] = await connection.execute(
            `SELECT student_id
             FROM students
             WHERE email = ?
             LIMIT 1`,
            [normalizedEmail]
        );

        if (existingStudent.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Email address is already registered",
                errors: {
                    email: "Email address is already registered."
                }
            });
        }

        // Hash password before saving
        const passwordHash = await bcrypt.hash(password, 10);

        // Create student login account
        const [userResult] = await connection.execute(
            `INSERT INTO users (username, password_hash, role)
             VALUES (?, ?, 'STUDENT')`,
            [normalizedRegistrationNo, passwordHash]
        );

        const userId = userResult.insertId;

        // Save uploaded image path, if provided
        const profilePhoto = getProfilePhotoPath(req) ?? null;

        // Create student profile
        const studentId = await createStudent(
            connection,
            userId,
            normalizedRegistrationNo,
            normalizedFirstName,
            normalizedLastName,
            normalizedEmail,
            normalizedPhoneNumber,
            profilePhoto
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Student account and profile created successfully",
            student: {
                student_id: studentId,
                user_id: userId,
                registration_no: normalizedRegistrationNo,
                first_name: normalizedFirstName,
                last_name: normalizedLastName,
                email: normalizedEmail,
                phone_number: normalizedPhoneNumber,
                profile_photo: profilePhoto,
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

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "Registration number or email is already registered."
            });
        }

        console.error("Create student error:", error);

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

// GET ALL STUDENTS
// GET /api/students/
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
    let connection;

    try {
        const studentId = req.params.id;

        const {
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        } = req.body;

        // Validate form fields
        const validationErrors = validateStudentInput({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            isCreating: false
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
                message: "Student not found"
            });
        }

        const normalizedRegistrationNo = registrationNo.trim();
        const normalizedFirstName = firstName.trim();
        const normalizedLastName = lastName.trim();
        const normalizedEmail = email.trim();
        const normalizedPhoneNumber = phoneNumber.trim();

        // Prevent duplicate username on another account
        const [existingUsers] = await pool.execute(
            `SELECT user_id
             FROM users
             WHERE username = ?
               AND user_id <> ?
             LIMIT 1`,
            [normalizedRegistrationNo, existingStudent.user_id]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Registration number is already registered",
                errors: {
                    registrationNo:
                        "Registration number is already registered."
                }
            });
        }

        // Prevent duplicate email on another student
        const [existingEmails] = await pool.execute(
            `SELECT student_id
             FROM students
             WHERE email = ?
               AND student_id <> ?
             LIMIT 1`,
            [normalizedEmail, studentId]
        );

        if (existingEmails.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email address is already registered",
                errors: {
                    email: "Email address is already registered."
                }
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Keep login username consistent with registration number
        await connection.execute(
            `UPDATE users
             SET username = ?
             WHERE user_id = ?`,
            [normalizedRegistrationNo, existingStudent.user_id]
        );

        // If a new image was uploaded, update it.
        // Otherwise, preserve the existing image.
        const newProfilePhoto = getProfilePhotoPath(req);

        let updateQuery;
        let updateValues;

        if (newProfilePhoto !== undefined) {
            updateQuery = `
                UPDATE students
                SET registration_no = ?,
                    first_name = ?,
                    last_name = ?,
                    email = ?,
                    phone_number = ?,
                    profile_photo = ?
                WHERE student_id = ?
            `;

            updateValues = [
                normalizedRegistrationNo,
                normalizedFirstName,
                normalizedLastName,
                normalizedEmail,
                normalizedPhoneNumber,
                newProfilePhoto,
                studentId
            ];
        } else {
            updateQuery = `
                UPDATE students
                SET registration_no = ?,
                    first_name = ?,
                    last_name = ?,
                    email = ?,
                    phone_number = ?
                WHERE student_id = ?
            `;

            updateValues = [
                normalizedRegistrationNo,
                normalizedFirstName,
                normalizedLastName,
                normalizedEmail,
                normalizedPhoneNumber,
                studentId
            ];
        }

        const [result] = await connection.execute(
            updateQuery,
            updateValues
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Student updated successfully",
            affectedRows: result.affectedRows
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Transaction rollback error:", rollbackError);
            }
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "Registration number or email is already registered."
            });
        }

        console.error("Update student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update student"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// DELETE STUDENT
// DELETE /api/students/:id
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

// GET CURRENT STUDENT'S OWN PROFILE
// GET /api/students/me
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
