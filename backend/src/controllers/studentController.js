
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const pool = require("../config/db");

const {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    updateStudent,
    deleteStudent
} = require("../models/studentModel");

// Remove an uploaded file if student creation fails
const removeUploadedFile = (file) => {
    if (!file?.path) return;

    fs.unlink(file.path, (error) => {
        if (error && error.code !== "ENOENT") {
            console.error("Failed to remove uploaded image:", error);
        }
    });
};

// Return a relative image URL for the frontend
const getProfileImageUrl = (filename) => {
    return filename ? `/uploads/students/${filename}` : null;
};

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


// CREATE STUDENT
// POST /api/students/
const addStudent = async (req, res) => {

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
    let transactionStarted = false;

    try {

        // Validate required fields
        if (
            !registrationNo ||
            !firstName ||
            !lastName ||
            !email ||
            !phoneNumber ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: "All student fields and password are required"
            });
        }


        // Get database connection
        connection = await pool.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

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
            transactionStarted = false;

            if (req.file) removeUploadedFile(req.file);

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
            transactionStarted = false;

            if (req.file) removeUploadedFile(req.file);

            return res.status(409).json({
                success: false,
                message: "Email address is already registered."
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create student user account
        const [userResult] = await connection.execute(
            `INSERT INTO users (username, password_hash, role)
             VALUES (?, ?, 'STUDENT')`,
            [registrationNo.trim(), passwordHash]
        );

        const userId = userResult.insertId;

        // Create student profile using the existing model
        const studentId = await createStudent(
            connection,
            userId,
            registrationNo.trim(),
            firstName.trim(),
            lastName.trim(),
            email.trim(),
            phoneNumber.trim()
        );

        // Save the uploaded image path against this student_id
        const imagePath = req.file
            ? getProfileImageUrl(req.file.filename)
            : null;

        await connection.execute(
            `UPDATE students
             SET profile_image = ?
             WHERE student_id = ?`,
            [imagePath, studentId]
        );

        await connection.commit();
        transactionStarted = false;

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
                profileImage: imagePath,
                role: "STUDENT"
            }
        });

    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Transaction rollback error:", rollbackError);
            }
        }

        if (req.file) removeUploadedFile(req.file);

        console.error("Create student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create student."
        });

    } finally {
        if (connection) connection.release();
    }
};


// GET ALL STUDENTS
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


// GET STUDENT BY ID
const getStudent = async (req, res) => {
    try {
        const student = await getStudentById(req.params.id);

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


// UPDATE STUDENT
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
        } = req.body;

        if (
            !registrationNo?.trim() ||
            !firstName?.trim() ||
            !lastName?.trim() ||
            !email?.trim() ||
            !phoneNumber?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "All student fields are required."
            });
        }

        const existingStudent = await getStudentById(studentId);

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        const result = await updateStudent(
            studentId,
            registrationNo.trim(),
            firstName.trim(),
            lastName.trim(),
            email.trim(),
            phoneNumber.trim()
        );

        return res.status(200).json({
            success: true,
            message: "Student updated successfully.",
            affectedRows: result.affectedRows
        });

    } catch (error) {
        console.error("Update student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update student."
        });
    }
};


// DELETE STUDENT
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

        // Remove image after the student record is deleted
        if (result.affectedRows > 0 && student.profile_image) {
            const filename = path.basename(student.profile_image);
            const imagePath = path.join(
                __dirname,
                "../../uploads/students",
                filename
            );

            fs.unlink(imagePath, (error) => {
                if (error && error.code !== "ENOENT") {
                    console.error("Image cleanup error:", error);
                }
            });
        }

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


// GET CURRENT STUDENT'S OWN PROFILE
const getMyProfile = async (req, res) => {
    try {
        const student = await getStudentByUserId(req.user.userId);

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


module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent
};
