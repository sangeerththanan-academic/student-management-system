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
    updateStudentProfile,
    deleteStudent
} = require("../models/studentModel");

const { validateStudentData, validateStudentProfileData } = require("../utils/validation");
const { generateStudentsCsv } = require("../utils/csvExport");


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


// UPDATE CURRENT STUDENT'S OWN PROFILE (CR-019)
// PUT /api/students/me
const updateMyProfile = async (req, res) => {
    try {
        // SEC-001 / SEC-002 / SEC-003: Derive identity from authenticated JWT userId
        const userId = req.user.userId;
        const { email, phoneNumber } = req.body;

        // FR-005 / SEC-006: Server-side validation
        const validation = validateStudentProfileData(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.firstError,
                errors: validation.errors
            });
        }

        // Verify that student profile exists for this authenticated user
        const existingStudent = await getStudentByUserId(userId);
        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found"
            });
        }

        const trimmedEmail = email.trim();
        const trimmedPhone = phoneNumber.trim();

        // Check if email already registered to another user
        const [existingEmail] = await pool.execute(
            `SELECT student_id
             FROM students
             WHERE email = ? AND user_id != ?
             LIMIT 1`,
            [trimmedEmail, userId]
        );

        if (existingEmail.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email address is already registered"
            });
        }

        // FR-006: Update only the authenticated student's existing record
        const result = await updateStudentProfile(
            userId,
            trimmedEmail,
            trimmedPhone
        );

        // FR-007: Retrieve updated profile
        const updatedStudent = await getStudentByUserId(userId);

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            student: updatedStudent,
            affectedRows: result.affectedRows
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Email address is already registered"
            });
        }

        console.error("Update my profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update profile"
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


// EXPORT ALL STUDENTS TO CSV (CR-015)
// GET /api/students/export/csv
const exportStudentsCsv = async (req, res) => {
    try {
        const students = await getAllStudents();
        const csvData = generateStudentsCsv(students);

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="students.csv"');
        return res.status(200).send(csvData);
    } catch (error) {
        console.error("Export students CSV error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to export student records"
        });
    }
};


// BULK IMPORT STUDENTS (CR-022)
// POST /api/students/bulk or /api/students/import
const bulkAddStudents = async (req, res) => {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({
            success: false,
            message: "No student records provided for import"
        });
    }

    if (students.length > 500) {
        return res.status(400).json({
            success: false,
            message: "Import batch size exceeds maximum limit of 500 students per upload"
        });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const createdStudents = [];
        const errors = [];

        // Check duplicates within the batch
        const regNosSeen = new Set();
        const emailsSeen = new Set();

        for (let i = 0; i < students.length; i++) {
            const rowNumber = i + 1;
            const item = students[i];

            const registrationNo = String(item.registrationNo || item.registration_no || "").trim();
            const firstName = String(item.firstName || item.first_name || "").trim();
            const lastName = String(item.lastName || item.last_name || "").trim();
            const email = String(item.email || "").trim();
            const phoneNumber = String(item.phoneNumber || item.phone_number || "").trim();
            const password = item.password && String(item.password).trim() !== ""
                ? String(item.password).trim()
                : "Student@123";

            const studentData = {
                registrationNo,
                firstName,
                lastName,
                email,
                phoneNumber,
                password
            };

            // CR-004 validation
            const validation = validateStudentData(studentData, false);
            if (!validation.isValid) {
                errors.push({
                    row: rowNumber,
                    registrationNo,
                    message: validation.firstError,
                    details: validation.errors
                });
                continue;
            }

            // Duplicates within batch
            if (regNosSeen.has(registrationNo.toLowerCase())) {
                errors.push({
                    row: rowNumber,
                    registrationNo,
                    message: `Duplicate registration number '${registrationNo}' found in import file.`
                });
                continue;
            }
            if (emailsSeen.has(email.toLowerCase())) {
                errors.push({
                    row: rowNumber,
                    registrationNo,
                    message: `Duplicate email '${email}' found in import file.`
                });
                continue;
            }

            // Check duplicate registrationNo / username in DB
            const [existingUser] = await connection.execute(
                `SELECT user_id FROM users WHERE username = ? LIMIT 1`,
                [registrationNo]
            );
            if (existingUser.length > 0) {
                errors.push({
                    row: rowNumber,
                    registrationNo,
                    message: `Registration number '${registrationNo}' is already registered in database.`
                });
                continue;
            }

            // Check duplicate email in DB
            const [existingStudent] = await connection.execute(
                `SELECT student_id FROM students WHERE email = ? LIMIT 1`,
                [email]
            );
            if (existingStudent.length > 0) {
                errors.push({
                    row: rowNumber,
                    registrationNo,
                    message: `Email address '${email}' is already registered in database.`
                });
                continue;
            }

            regNosSeen.add(registrationNo.toLowerCase());
            emailsSeen.add(email.toLowerCase());

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Insert user
            const [userResult] = await connection.execute(
                `INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'STUDENT')`,
                [registrationNo, passwordHash]
            );
            const userId = userResult.insertId;

            // Insert student
            const studentId = await createStudent(
                connection,
                userId,
                registrationNo,
                firstName,
                lastName,
                email,
                phoneNumber,
                null
            );

            createdStudents.push({
                studentId,
                userId,
                registrationNo,
                firstName,
                lastName,
                email,
                phoneNumber
            });
        }

        // If there were any errors and no students created, rollback
        if (createdStudents.length === 0 && errors.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: "No student records could be imported due to validation or duplicate errors.",
                importedCount: 0,
                failedCount: errors.length,
                errors
            });
        }

        // Commit successful insertions
        await connection.commit();

        return res.status(201).json({
            success: true,
            message: `Successfully imported ${createdStudents.length} student${createdStudents.length === 1 ? "" : "s"}.` +
                (errors.length > 0 ? ` ${errors.length} record(s) failed.` : ""),
            importedCount: createdStudents.length,
            failedCount: errors.length,
            errors,
            students: createdStudents
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Bulk import students error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to import student records"
        });
    } finally {
        if (connection) connection.release();
    }
};


module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
    editStudent,
    removeStudent,
    exportStudentsCsv,
    bulkAddStudents
};
