const bcrypt = require("bcryptjs");
const fs = require("fs/promises");
const path = require("path");
const { randomInt } = require("crypto");

const pool = require("../config/db");

const {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    updateStudent,
    updateUserProfileImage,
    setUserProfileImage,
    deleteStudent
} = require("../models/studentModel");

const uploadDirectory = path.join(__dirname, "../../uploads/students");

const saveProfileImage = async (file, username) => {
    await fs.mkdir(uploadDirectory, { recursive: true });

    const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, "_");
    const extension = path.extname(file.originalname).toLowerCase();

    for (let attempt = 0; attempt < 1000; attempt += 1) {
        const suffix = String(randomInt(0, 1000)).padStart(3, "0");
        const filename = `${safeUsername}_${suffix}${extension}`;
        const filePath = path.join(uploadDirectory, filename);

        try {
            await fs.writeFile(filePath, file.buffer, { flag: "wx" });
            return {
                filePath,
                url: `/uploads/students/${filename}`
            };
        } catch (error) {
            if (error.code !== "EEXIST") throw error;
        }
    }

    throw new Error("Could not generate a unique profile image filename.");
};

const getStoredImagePath = (profileImageUrl) => {
    if (!profileImageUrl) return null;

    const imagePath = new URL(profileImageUrl, "http://localhost").pathname;
    if (!imagePath.startsWith("/uploads/students/")) return null;

    return path.join(uploadDirectory, path.basename(imagePath));
};

const removeFile = async (filePath) => {
    if (!filePath) return;

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") throw error;
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
    let savedImage;
    let transactionCommitted = false;

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

        //CR-004
        const trimmedFirstName = firstName.trim();
        const trimmedLastName = lastName.trim();
        const trimmedphoneNumber = phoneNumber.trim();
        const trimmedPassword = password.trim();

        const alphabetRegex = /^[A-Za-z\s]+$/;
        const symbolOrNumberRegex = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,}$/;

        if (trimmedFirstName.length < 3 || trimmedLastName.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Require first name and last name to contain at least 3 characters"
            });
        }

        if (symbolOrNumberRegex.test(trimmedFirstName) || symbolOrNumberRegex.test(trimmedLastName)) {
            return res.status(400).json({
                success: false,
                message: "Numbers and symbols are not allowed in first name and last name"
            });
        }

        if (!alphabetRegex.test(trimmedFirstName) || !alphabetRegex.test(trimmedLastName)) {
            return res.status(400).json({
                success: false,
                message: "Alphabetic characters only allowed in first name and last name"
            });
        }

        if (trimmedphoneNumber.length < 10 || trimmedphoneNumber.length > 10) {
            return res.status(400).json({
                success: false,
                message: "Phone number to contain exactly 10 digits"
            });
        }

        if (!phoneRegex.test(trimmedphoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Alphabetic characters and symbols are not allowed in PhoneNumber"
            });
        }

        if (!passwordRegex.test(trimmedPassword)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
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

            return res.status(409).json({
                success: false,
                message: "Email address is already registered"
            });
        }


        // Hash student password
        const passwordHash = await bcrypt.hash(password, 10);


        // Create user account
        if (req.file) {
            savedImage = await saveProfileImage(req.file, registrationNo);
        }

        const [userResult] = await connection.execute(
            `INSERT INTO users
            (
                username,
                password_hash,
                role,
                profile_img_url
            )
            VALUES (?, ?, 'STUDENT', ?)`,
            [
                registrationNo,
                passwordHash,
                savedImage?.url || null
            ]
        );

        const userId = userResult.insertId;


        // Create student profile
        const studentId = await createStudent(
            connection,
            userId,
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        );


        // Commit transaction
        await connection.commit();
        transactionCommitted = true;


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
                role: "STUDENT"
            }
        });

    } catch (error) {

        // Rollback if transaction started
        if (connection) {
            await connection.rollback();
        }

        if (!transactionCommitted && savedImage) {
            await removeFile(savedImage.filePath).catch(console.error);
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

    let connection;
    let savedImage;
    let transactionCommitted = false;

    try {

        const studentId = req.params.id;

        const {
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        } = req.body;


        // Validate input
        if (
            !registrationNo ||
            !firstName ||
            !lastName ||
            !email ||
            !phoneNumber
        ) {

            return res.status(400).json({
                success: false,
                message: "All student fields are required"
            });
        }

        //CR-004
        const trimmedFirstName = firstName.trim();
        const trimmedLastName = lastName.trim();
        const trimmedphoneNumber = phoneNumber.trim();

        const alphabetRegex = /^[A-Za-z\s]+$/;
        const symbolOrNumberRegex = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
        const phoneRegex = /^\+?[0-9]{10,15}$/;

        if (trimmedFirstName.length < 3 || trimmedLastName.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Require first name and last name to contain at least 3 characters"
            });
        }

        if (symbolOrNumberRegex.test(trimmedFirstName) || symbolOrNumberRegex.test(trimmedLastName)) {
            return res.status(400).json({
                success: false,
                message: "Numbers and symbols are not allowed in first name and last name"
            });
        }

        if (!alphabetRegex.test(trimmedFirstName) || !alphabetRegex.test(trimmedLastName)) {
            return res.status(400).json({
                success: false,
                message: "Alphabetic characters in first name and last name"
            });
        }

        if (trimmedphoneNumber.length < 10 || trimmedphoneNumber.length > 10) {
            return res.status(400).json({
                success: false,
                message: "Phone number to contain exactly 10 digits"
            });
        }

        if (!phoneRegex.test(trimmedphoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Alphabetic characters and symbols are not allowed in PhoneNumber"
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


        if (req.file) {
            savedImage = await saveProfileImage(req.file, registrationNo);
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const result = await updateStudent(
            studentId,
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            connection
        );

        await updateUserProfileImage(
            connection,
            existingStudent.user_id,
            registrationNo,
            savedImage?.url || null
        );

        await connection.commit();
        transactionCommitted = true;

        if (savedImage) {
            await removeFile(getStoredImagePath(existingStudent.profile_img_url))
                .catch((error) => console.error("Failed to remove previous profile image:", error));
        }


        return res.status(200).json({
            success: true,
            message: "Student updated successfully",
            affectedRows: result.affectedRows
        });

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        if (!transactionCommitted && savedImage) {
            await removeFile(savedImage.filePath).catch(console.error);
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


const updateMyProfileImage = async (req, res) => {
    let connection;
    let savedImage;
    let transactionCommitted = false;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Choose a profile image to upload."
            });
        }

        const student = await getStudentByUserId(req.user.userId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found"
            });
        }

        savedImage = await saveProfileImage(req.file, student.registration_no);
        connection = await pool.getConnection();
        await connection.beginTransaction();
        await setUserProfileImage(connection, student.user_id, savedImage.url);
        await connection.commit();
        transactionCommitted = true;

        await removeFile(getStoredImagePath(student.profile_img_url))
            .catch((error) => console.error("Failed to remove previous profile image:", error));

        return res.status(200).json({
            success: true,
            message: "Profile image updated successfully",
            profileImageUrl: savedImage.url
        });
    } catch (error) {
        if (connection && !transactionCommitted) {
            await connection.rollback().catch(() => {});
        }

        if (!transactionCommitted && savedImage) {
            await removeFile(savedImage.filePath).catch(console.error);
        }

        console.error("Update profile image error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update profile image"
        });
    } finally {
        if (connection) connection.release();
    }
};


const removeMyProfileImage = async (req, res) => {
    let connection;

    try {
        const student = await getStudentByUserId(req.user.userId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found"
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();
        await setUserProfileImage(connection, student.user_id, null);
        await connection.commit();

        await removeFile(getStoredImagePath(student.profile_img_url))
            .catch((error) => console.error("Failed to remove profile image:", error));

        return res.status(200).json({
            success: true,
            message: "Profile image removed successfully"
        });
    } catch (error) {
        if (connection) {
            await connection.rollback().catch(() => {});
        }

        console.error("Remove profile image error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to remove profile image"
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
    updateMyProfileImage,
    removeMyProfileImage,
    editStudent,
    removeStudent
};
