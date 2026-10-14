const fs = require("fs");
const path = require("path");
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


// Helper to delete an uploaded file safely
const removeUploadedFile = (filePath) => {
    if (!filePath) return;
    try {
        const fullPath = path.isAbsolute(filePath)
            ? filePath
            : path.resolve(__dirname, "../../", filePath.replace(/^\//, ""));
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (err) {
        console.error("Failed to clean up file:", err.message);
    }
};


// CREATE STUDENT
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
    const uploadedFile = req.file;

    try {

        // Validate input data (CR-004)
        const validation = validateStudentData(req.body, false);
        if (!validation.isValid) {
            if (uploadedFile) removeUploadedFile(uploadedFile.path);
            return res.status(400).json({
                success: false,
                message: validation.firstError,
                errors: validation.errors
            });
        }


        // Get database connection
        connection = await pool.getConnection();


        // Start transaction
        await connection.beginTransaction();


        // Check duplicate username
        const [existingUser] = await connection.execute(
            `SELECT user_id
             FROM users
             WHERE username = ?
             LIMIT 1`,
            [registrationNo]
        );

        if (existingUser.length > 0) {

            await connection.rollback();
            if (uploadedFile) removeUploadedFile(uploadedFile.path);

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
            [email]
        );

        if (existingStudent.length > 0) {

            await connection.rollback();
            if (uploadedFile) removeUploadedFile(uploadedFile.path);

            return res.status(409).json({
                success: false,
                message: "Email address is already registered"
            });
        }


        // Hash student password
        const passwordHash = await bcrypt.hash(password, 10);


        // Create user account
        const [userResult] = await connection.execute(
            `INSERT INTO users
            (
                username,
                password_hash,
                role
            )
            VALUES (?, ?, 'STUDENT')`,
            [
                registrationNo,
                passwordHash
            ]
        );

        const userId = userResult.insertId;

        // Profile photo path (CR-010)
        const profilePhotoPath = uploadedFile
            ? `/uploads/students/${uploadedFile.filename}`
            : null;

        // Create student profile
        const studentId = await createStudent(
            connection,
            userId,
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            profilePhotoPath
        );


        // Commit transaction
        await connection.commit();


        // Success response
        return res.status(201).json({
            success: true,
            message: "Student account and profile created successfully",
            student: {
                studentId,
                userId,
                registrationNo,
                firstName,
                lastName,
                email,
                phoneNumber,
                profilePhoto: profilePhotoPath,
                role: "STUDENT"
            }
        });

    } catch (error) {

        // Rollback if transaction started
        if (connection) {
            await connection.rollback();
        }

        if (uploadedFile) removeUploadedFile(uploadedFile.path);

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

    try {

        const studentId = req.params.id;

        const {
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            password
        } = req.body;


        // Validate input data (CR-004)
        const validation = validateStudentData(req.body, true);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.firstError,
                errors: validation.errors
            });
        }


        // Check student exists
        const existingStudent = await getStudentById(studentId);

        if (!existingStudent) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }


        // Update student
        const result = await updateStudent(
            studentId,
            registrationNo.trim(),
            firstName.trim(),
            lastName.trim(),
            email.trim(),
            phoneNumber.trim()
        );

        // Update password if provided
        if (password && typeof password === "string" && password.trim() !== "") {
            const passwordHash = await bcrypt.hash(password, 10);
            await pool.execute(
                "UPDATE users SET password_hash = ? WHERE user_id = ?",
                [passwordHash, existingStudent.user_id]
            );
        }


        return res.status(200).json({
            success: true,
            message: "Student updated successfully",
            affectedRows: result.affectedRows
        });

    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {
            const isEmail = error.message && error.message.toLowerCase().includes("email");
            return res.status(409).json({
                success: false,
                message: isEmail ? "Email address is already registered" : "Registration number is already registered"
            });
        }

        console.error("Update student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update student"
        });
    }
};


// DELETE STUDENT
// DELETE /api/students/:id
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

        // Remove profile photo from disk if one exists (CR-010)
        if (student.profile_photo) {
            removeUploadedFile(student.profile_photo);
        }

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


// CHANGE OWN PASSWORD (CR-020)
// PUT /api/students/me/change-password
const changeMyPassword = async (req, res) => {
    try {
        // SEC-001: Must be authenticated (middleware enforces this)
        const userId = req.user.userId;

        const { password } = req.body;

        // FR-001 / FR-002: Validate that password is provided
        if (!password || typeof password !== "string" || password.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Password is required."
            });
        }

        // SEC-002 / FR-002: Hash new password before storing
        const passwordHash = await bcrypt.hash(password.trim(), 10);

        // Update in users table for the authenticated student
        const [result] = await pool.execute(
            "UPDATE users SET password_hash = ? WHERE user_id = ?",
            [passwordHash, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Password changed successfully."
        });

    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to change password."
        });
    }
};


module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    changeMyPassword,
    editStudent,
    removeStudent
};
