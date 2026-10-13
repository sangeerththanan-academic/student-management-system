const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const pool = require("../config/db");

const {
    sanitizeRegistrationNo,
    PROFILE_DIR,
    MIME_TO_EXT
} = require("../middleware/uploadProfilePhoto");

const {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    updateStudent,
    deleteStudent
} = require("../models/studentModel");


// Delete an uploaded file on failure so failed requests leave no orphans.
const deleteUploadedFile = (file) => {
    if (!file || !file.path) return;
    try {
        fs.unlinkSync(file.path);
    } catch (e) {
        // Best effort: file may already be gone
    }
};

// Multer may have stored the file under a temp name when fields arrived
// after the file part. Rename it to <REGNO>.<ext> once registrationNo
// is validated, cleaning up any sibling with a different extension.
const resolveProfileImagePath = (file, registrationNo) => {
    if (!file) return null;

    const safeRegNo = sanitizeRegistrationNo(registrationNo);
    const ext = MIME_TO_EXT[file.mimetype] || path.extname(file.filename).toLowerCase() || ".jpg";
    const finalName = `${safeRegNo}${ext}`;
    const finalPath = path.join(PROFILE_DIR, finalName);

    if (file.filename !== finalName) {
        try {
            const siblings = fs.readdirSync(PROFILE_DIR);
            for (const name of siblings) {
                if (name !== file.filename && name !== finalName && name.startsWith(`${safeRegNo}.`)) {
                    try {
                        fs.unlinkSync(path.join(PROFILE_DIR, name));
                    } catch (e) {
                        // Best effort cleanup
                    }
                }
            }
            fs.renameSync(file.path, finalPath);
        } catch (e) {
            // If rename fails, keep the temp file so the record still has an image
            return `uploads/profiles/${file.filename}`.replace(/\\/g, "/");
        }
    }

    return `uploads/profiles/${finalName}`.replace(/\\/g, "/");
};


// CREATE STUDENT
const addStudent = async (req, res) => {

    // multipart/form-data fields can arrive with surrounding whitespace
    const trimOrSelf = (v) => (typeof v === "string" ? v.trim() : v);
    const registrationNo = trimOrSelf(req.body.registrationNo);
    const firstName = trimOrSelf(req.body.firstName);
    const lastName = trimOrSelf(req.body.lastName);
    const email = trimOrSelf(req.body.email);
    const phoneNumber = trimOrSelf(req.body.phoneNumber);
    const { password } = req.body;

    let connection;

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

            deleteUploadedFile(req.file);

            return res.status(400).json({
                success: false,
                message: "All student fields and password are required"
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

            deleteUploadedFile(req.file);

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

            deleteUploadedFile(req.file);

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


        // Profile photo is optional; falls back to temp->final rename if needed
        const profileImage = resolveProfileImagePath(req.file, registrationNo);


        // Create student profile
        const studentId = await createStudent(
            connection,
            userId,
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            profileImage
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
                profile_image: profileImage,
                role: "STUDENT"
            }
        });

    } catch (error) {

        // Rollback if transaction started
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                // Ignore rollback errors, report the original failure
            }
        }

        deleteUploadedFile(req.file);

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

    // Track a newly uploaded file so it can be removed if the update fails
    const uploadedFile = req.file || null;
    let newProfileImage = undefined;

    try {

        const studentId = req.params.id;

        // multipart/form-data fields can arrive with surrounding whitespace
        const trimOrSelf = (v) => (typeof v === "string" ? v.trim() : v);
        const registrationNo = trimOrSelf(req.body.registrationNo);
        const firstName = trimOrSelf(req.body.firstName);
        const lastName = trimOrSelf(req.body.lastName);
        const email = trimOrSelf(req.body.email);
        const phoneNumber = trimOrSelf(req.body.phoneNumber);


        // Validate input
        if (
            !registrationNo ||
            !firstName ||
            !lastName ||
            !email ||
            !phoneNumber
        ) {

            deleteUploadedFile(uploadedFile);

            return res.status(400).json({
                success: false,
                message: "All student fields are required"
            });
        }


        // Check student exists
        const existingStudent = await getStudentById(studentId);

        if (!existingStudent) {

            deleteUploadedFile(uploadedFile);

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const oldSafeRegNo = sanitizeRegistrationNo(existingStudent.registration_no);
        const newSafeRegNo = sanitizeRegistrationNo(registrationNo);
        const regNoChanged = oldSafeRegNo !== newSafeRegNo;


        if (uploadedFile) {
            // New photo uploaded: store as <NEW_REGNO>.<ext>
            newProfileImage = resolveProfileImagePath(uploadedFile, registrationNo);
        } else if (regNoChanged && existingStudent.profile_image) {
            // Registration number changed but photo kept: rename the file
            // so the <REGNO>.<ext> convention still holds.
            try {
                const oldRelative = String(existingStudent.profile_image).replace(/\\/g, "/");
                const oldName = oldRelative.split("/").pop();
                const oldExt = path.extname(oldName || "").toLowerCase() || ".jpg";
                const oldPath = path.join(PROFILE_DIR, oldName);
                const newName = `${newSafeRegNo}${oldExt}`;
                const newPath = path.join(PROFILE_DIR, newName);

                if (oldName !== newName && fs.existsSync(oldPath)) {
                    fs.renameSync(oldPath, newPath);
                    newProfileImage = `uploads/profiles/${newName}`.replace(/\\/g, "/");
                } else {
                    newProfileImage = existingStudent.profile_image;
                }
            } catch (e) {
                newProfileImage = existingStudent.profile_image;
            }
        }


        // Update student (profileImage undefined keeps the existing photo)
        const result = await updateStudent(
            studentId,
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            newProfileImage
        );


        return res.status(200).json({
            success: true,
            message: "Student updated successfully",
            affectedRows: result.affectedRows,
            profile_image: newProfileImage !== undefined ? newProfileImage : existingStudent.profile_image
        });

    } catch (error) {

        // Remove a newly uploaded file if the update failed
        if (uploadedFile && newProfileImage) {
            try {
                const savedName = String(newProfileImage).split("/").pop();
                const savedPath = path.join(PROFILE_DIR, savedName);
                if (fs.existsSync(savedPath)) {
                    fs.unlinkSync(savedPath);
                }
            } catch (e) {
                // Best effort cleanup
            }
        } else {
            deleteUploadedFile(uploadedFile);
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


module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent
};
