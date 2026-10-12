
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

const { removeFile } = require("../middleware/uploadMiddleware");

const registrationNumberRegex =
    /^[A-Za-z0-9]+(?:[-/][A-Za-z0-9]+)*$/;
const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;
const uppercaseRegex = /[A-Z]/;
const lowercaseRegex = /[a-z]/;
const numberRegex = /[0-9]/;
const specialCharacterRegex = /[^A-Za-z0-9]/;

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

    const registration = String(registrationNo || "").trim();
    const first = String(firstName || "").trim();
    const last = String(lastName || "").trim();
    const cleanEmail = String(email || "").trim();
    const phone = String(phoneNumber || "").trim();

    if (!registration) {
        errors.registrationNo = "Registration number is required.";
    } else if (!registrationNumberRegex.test(registration)) {
        errors.registrationNo =
            "Registration number contains invalid characters.";
    }

    if (!first) {
        errors.firstName = "First name is required.";
    } else if (first.length < 3) {
        errors.firstName =
            "First name must contain at least 3 characters.";
    } else if (!nameRegex.test(first)) {
        errors.firstName =
            "First name can contain only valid alphabetic characters.";
    }

    if (!last) {
        errors.lastName = "Last name is required.";
    } else if (last.length < 3) {
        errors.lastName =
            "Last name must contain at least 3 characters.";
    } else if (!nameRegex.test(last)) {
        errors.lastName =
            "Last name can contain only valid alphabetic characters.";
    }

    if (!cleanEmail) {
        errors.email = "Email address is required.";
    } else if (!emailRegex.test(cleanEmail)) {
        errors.email = "Please enter a valid email address.";
    }

    if (!phone) {
        errors.phoneNumber = "Phone number is required.";
    } else if (!/^\d+$/.test(phone)) {
        errors.phoneNumber =
            "Phone number must contain numeric characters only.";
    } else if (!phoneRegex.test(phone)) {
        errors.phoneNumber =
            "Phone number must contain exactly 10 digits.";
    }

    if (requirePassword) {
        if (!password) {
            errors.password = "Password is required for a new student.";
        } else if (password.length < 8) {
            errors.password = "Password must contain at least 8 characters.";
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

const getUploadedPhotoPath = (file) => {
    if (!file) return null;

    // This is the relative URL saved in MySQL.
    return `/uploads/students/${path.basename(file.filename)}`;
};

const getDiskPathFromPhotoUrl = (photoUrl) => {
    if (
        !photoUrl ||
        !photoUrl.startsWith("/uploads/students/")
    ) {
        return null;
    }

    const filename = path.basename(photoUrl);
    return path.join(
        __dirname,
        "..",
        "uploads",
        "students",
        filename
    );
};

const removeOldPhotoIfDifferent = async (oldPhoto, newPhoto) => {
    if (!oldPhoto || oldPhoto === newPhoto) return;

    await removeFile(getDiskPathFromPhotoUrl(oldPhoto));
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

    try {
        const validationErrors = validateStudentInput({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            requirePassword: true
        });

        if (Object.keys(validationErrors).length > 0) {
            await removeFile(req.file?.path);

            return res.status(400).json({
                success: false,
                message: "Please correct the invalid student information.",
                errors: validationErrors
            });
        }

        const cleanRegistrationNo = registrationNo.trim();
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim();
        const cleanPhoneNumber = phoneNumber.trim();
        const profilePhoto = getUploadedPhotoPath(req.file);

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [existingUser] = await connection.execute(
            `SELECT user_id FROM users WHERE username = ? LIMIT 1`,
            [cleanRegistrationNo]
        );

        if (existingUser.length > 0) {
            await connection.rollback();
            await removeFile(req.file?.path);

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered."
            });
        }

        const [existingStudent] = await connection.execute(
            `SELECT student_id FROM students WHERE email = ? LIMIT 1`,
            [cleanEmail]
        );

        if (existingStudent.length > 0) {
            await connection.rollback();
            await removeFile(req.file?.path);

            return res.status(409).json({
                success: false,
                message: "Email address is already registered."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [userResult] = await connection.execute(
            `INSERT INTO users (username, password_hash, role)
             VALUES (?, ?, 'STUDENT')`,
            [cleanRegistrationNo, passwordHash]
        );

        const userId = userResult.insertId;

        const studentId = await createStudent(
            connection,
            userId,
            cleanRegistrationNo,
            cleanFirstName,
            cleanLastName,
            cleanEmail,
            cleanPhoneNumber,
            profilePhoto
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Student account and profile created successfully.",
            student: {
                student_id: studentId,
                user_id: userId,
                registration_no: cleanRegistrationNo,
                first_name: cleanFirstName,
                last_name: cleanLastName,
                email: cleanEmail,
                phone_number: cleanPhoneNumber,
                profile_photo: profilePhoto,
                role: "STUDENT"
            }
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback error:", rollbackError);
            }
        }

        await removeFile(req.file?.path);

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
const getStudents = async (_req, res) => {
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

        return res.status(200).json({ success: true, student });
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

        const {
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        } = req.body;

        const validationErrors = validateStudentInput({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            requirePassword: false
        });

        if (Object.keys(validationErrors).length > 0) {
            await removeFile(req.file?.path);

            return res.status(400).json({
                success: false,
                message: "Please correct the invalid student information.",
                errors: validationErrors
            });
        }

        const existingStudent = await getStudentById(studentId);

        if (!existingStudent) {
            await removeFile(req.file?.path);

            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        const cleanRegistrationNo = registrationNo.trim();
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim();
        const cleanPhoneNumber = phoneNumber.trim();

        // Preserve the existing image if no new image is selected.
        const newPhoto = req.file
            ? getUploadedPhotoPath(req.file)
            : existingStudent.profile_photo || null;

        // Check registration number isn't used by another student.
        const [duplicateUsername] = await pool.execute(
            `SELECT user_id
             FROM users
             WHERE username = ?
               AND user_id <> ?
             LIMIT 1`,
            [cleanRegistrationNo, existingStudent.user_id]
        );

        if (duplicateUsername.length > 0) {
            await removeFile(req.file?.path);

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered."
            });
        }

        const [duplicateEmail] = await pool.execute(
            `SELECT student_id
             FROM students
             WHERE email = ?
               AND student_id <> ?
             LIMIT 1`,
            [cleanEmail, studentId]
        );

        if (duplicateEmail.length > 0) {
            await removeFile(req.file?.path);

            return res.status(409).json({
                success: false,
                message: "Email address is already registered."
            });
        }

        // Keep the login username aligned with the registration number.
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            await connection.execute(
                `UPDATE users SET username = ? WHERE user_id = ?`,
                [cleanRegistrationNo, existingStudent.user_id]
            );

            await connection.execute(
                `UPDATE students
                 SET registration_no = ?,
                     first_name = ?,
                     last_name = ?,
                     email = ?,
                     phone_number = ?,
                     profile_photo = ?
                 WHERE student_id = ?`,
                [
                    cleanRegistrationNo,
                    cleanFirstName,
                    cleanLastName,
                    cleanEmail,
                    cleanPhoneNumber,
                    newPhoto,
                    studentId
                ]
            );

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            await removeFile(req.file?.path);
            throw error;
        } finally {
            connection.release();
        }

        if (req.file) {
            await removeOldPhotoIfDifferent(
                existingStudent.profile_photo,
                newPhoto
            );
        }

        return res.status(200).json({
            success: true,
            message: "Student updated successfully.",
            profile_photo: newPhoto
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
        const student = await getStudentById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        const result = await deleteStudent(req.params.id);

        if (result.affectedRows > 0) {
            await removeFile(
                getDiskPathFromPhotoUrl(student.profile_photo)
            );
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

// GET CURRENT STUDENT PROFILE
const getMyProfile = async (req, res) => {
    try {
        const student = await getStudentByUserId(req.user.userId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found."
            });
        }

        return res.status(200).json({ success: true, student });
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