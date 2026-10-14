
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
            console.error(
                "Failed to remove uploaded image:",
                error
            );
        }
    });
};

// Return a relative image URL for the frontend
const getProfileImageUrl = (filename) => {
    return filename
        ? `/uploads/students/${filename}`
        : null;
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
    let transactionStarted = false;

    try {
        if (
            !registrationNo?.trim() ||
            !firstName?.trim() ||
            !lastName?.trim() ||
            !email?.trim() ||
            !phoneNumber?.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            if (req.file) removeUploadedFile(req.file);

            return res.status(400).json({
                success: false,
                message: "All student fields and password are required."
            });
        }

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

        // Create student profile using existing model
        const studentId = await createStudent(
            connection,
            userId,
            registrationNo.trim(),
            firstName.trim(),
            lastName.trim(),
            email.trim(),
            phoneNumber.trim()
        );

        // Save uploaded image path
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
                console.error(
                    "Transaction rollback error:",
                    rollbackError
                );
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
// GET /api/students
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
// GET /api/students/:id
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
// PUT /api/students/:id
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
// DELETE /api/students/:id
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

        // Remove image after student record is deleted
        if (result.affectedRows > 0 && student.profile_image) {
            const filename = path.basename(student.profile_image);

            const imagePath = path.join(
                __dirname,
                "../../uploads/students",
                filename
            );

            fs.unlink(imagePath, (error) => {
                if (error && error.code !== "ENOENT") {
                    console.error(
                        "Image cleanup error:",
                        error
                    );
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
// GET /api/students/me
const getMyProfile = async (req, res) => {
    try {
        const student = await getStudentByUserId(
            req.user.userId
        );

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


// CHANGE STUDENT PASSWORD
// POST /api/students/change-password
const changeStudentPassword = async (req, res) => {
    try {
        const {
            oldPassword,
            newPassword,
            confirmPassword
        } = req.body;

        // Validate all password fields
        if (
            typeof oldPassword !== "string" ||
            typeof newPassword !== "string" ||
            typeof confirmPassword !== "string" ||
            !oldPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required."
            });
        }

        // Validate new password length
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters."
            });
        }

        // Validate confirmation
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and re-entered password do not match."
            });
        }

        // Prevent reusing the old password
        if (oldPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from the old password."
            });
        }

        // Obtain the user ID from the authenticated session/token
        const userId = req.user.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        // Only allow an authenticated student account
        const [users] = await pool.execute(
            `SELECT user_id, password_hash
             FROM users
             WHERE user_id = ?
               AND role = 'STUDENT'
             LIMIT 1`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student account not found."
            });
        }

        const user = users[0];

        // Verify old password
        const oldPasswordMatches = await bcrypt.compare(
            oldPassword,
            user.password_hash
        );

        if (!oldPasswordMatches) {
            return res.status(400).json({
                success: false,
                message: "Old password is incorrect."
            });
        }

        // Hash the new password
        const newPasswordHash = await bcrypt.hash(
            newPassword,
            10
        );

        // Update only the authenticated student's account
        const [result] = await pool.execute(
            `UPDATE users
             SET password_hash = ?
             WHERE user_id = ?
               AND role = 'STUDENT'`,
            [newPasswordHash, userId]
        );

        if (result.affectedRows !== 1) {
            return res.status(500).json({
                success: false,
                message: "Password could not be updated."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Password changed successfully."
        });

    } catch (error) {
        console.error(
            "Change student password error:",
            error
        );

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
    editStudent,
    removeStudent,
    changeStudentPassword
};
