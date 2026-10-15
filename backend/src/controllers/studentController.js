
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    updateStudent,
    deleteStudent,
    getPasswordHashByUserId,
    updatePasswordHashByUserId
} = require("../models/studentModel");

// ============================================================
// CR-004 VALIDATION HELPERS
// ============================================================

const validateRegistrationNo = (registrationNo) => {
    if (
        typeof registrationNo !== "string" ||
        !registrationNo.trim()
    ) {
        return "Registration number is required.";
    }

    if (!/^[A-Za-z0-9/-]+$/.test(registrationNo.trim())) {
        return "Registration number can contain only letters, numbers, hyphens, and slashes.";
    }

    return null;
};

const validateFirstName = (firstName) => {
    if (typeof firstName !== "string" || !firstName.trim()) {
        return "First name is required.";
    }

    const value = firstName.trim();

    if (value.length < 3) {
        return "First name must contain at least 3 characters.";
    }

    if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(value)) {
        return "First name can contain only valid alphabetic characters.";
    }

    return null;
};

const validateLastName = (lastName) => {
    if (typeof lastName !== "string" || !lastName.trim()) {
        return "Last name is required.";
    }

    const value = lastName.trim();

    if (value.length < 3) {
        return "Last name must contain at least 3 characters.";
    }

    if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(value)) {
        return "Last name can contain only valid alphabetic characters.";
    }

    return null;
};

const validateEmail = (email) => {
    if (typeof email !== "string" || !email.trim()) {
        return "Email address is required.";
    }

    const value = email.trim();

    if (
        !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)
    ) {
        return "Please enter a valid email address.";
    }

    return null;
};

const validatePhoneNumber = (phoneNumber) => {
    if (typeof phoneNumber !== "string" || !phoneNumber.trim()) {
        return "Phone number is required.";
    }

    const value = phoneNumber.trim();

    if (!/^\d+$/.test(value)) {
        return "Phone number must contain numeric characters only.";
    }

    if (value.length !== 10) {
        return "Phone number must contain exactly 10 digits.";
    }

    return null;
};

const validatePassword = (password) => {
    if (typeof password !== "string" || !password) {
        return "Password is required for a new student.";
    }

    if (password.length < 8) {
        return "Password must contain at least 8 characters.";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
    }

    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
    }

    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number.";
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        return "Password must contain at least one special character.";
    }

    return null;
};

const validateStudentFields = ({
    registrationNo,
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
    requirePassword = false
}) => {
    const errors = {};

    const registrationError = validateRegistrationNo(registrationNo);
    if (registrationError) errors.registrationNo = registrationError;

    const firstNameError = validateFirstName(firstName);
    if (firstNameError) errors.firstName = firstNameError;

    const lastNameError = validateLastName(lastName);
    if (lastNameError) errors.lastName = lastNameError;

    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;

    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) errors.phoneNumber = phoneError;

    if (requirePassword) {
        const passwordError = validatePassword(password);
        if (passwordError) errors.password = passwordError;
    }

    return errors;
};

// ============================================================
// CREATE STUDENT — CR-010 PROFILE IMAGE SUPPORT
// ============================================================

const addStudent = async (req, res) => {
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
        const validationErrors = validateStudentFields({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            requirePassword: true
        });

        if (Object.keys(validationErrors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed. Please correct the provided student information.",
                errors: validationErrors
            });
        }

        const cleanRegistrationNo = registrationNo.trim();
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim();
        const cleanPhoneNumber = phoneNumber.trim();

        const profilePhoto = req.file
            ? `/uploads/${req.file.filename}`
            : null;

        connection = await pool.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        const [existingUser] = await connection.execute(
            `SELECT user_id
             FROM users
             WHERE username = ?
             LIMIT 1`,
            [cleanRegistrationNo]
        );

        if (existingUser.length > 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered"
            });
        }

        const [existingStudent] = await connection.execute(
            `SELECT student_id
             FROM students
             WHERE email = ?
             LIMIT 1`,
            [cleanEmail]
        );

        if (existingStudent.length > 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(409).json({
                success: false,
                message: "Email address is already registered"
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
        transactionStarted = false;

        return res.status(201).json({
            success: true,
            message: "Student account and profile created successfully",
            student: {
                studentId,
                userId,
                registrationNo: cleanRegistrationNo,
                firstName: cleanFirstName,
                lastName: cleanLastName,
                email: cleanEmail,
                phoneNumber: cleanPhoneNumber,
                profilePhoto,
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

// ============================================================
// GET ALL STUDENTS
// ============================================================

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

// ============================================================
// GET STUDENT BY ID
// ============================================================

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

// ============================================================
// UPDATE STUDENT
// ============================================================

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

        const validationErrors = validateStudentFields({
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
                message: "Validation failed. Please correct the provided student information.",
                errors: validationErrors
            });
        }

        const cleanRegistrationNo = registrationNo.trim();
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim();
        const cleanPhoneNumber = phoneNumber.trim();

        const existingStudent = await getStudentById(studentId);

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const [existingUser] = await pool.execute(
            `SELECT user_id
             FROM users
             WHERE username = ?
             AND user_id != ?
             LIMIT 1`,
            [cleanRegistrationNo, existingStudent.user_id]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Registration number is already registered"
            });
        }

        const [existingEmail] = await pool.execute(
            `SELECT student_id
             FROM students
             WHERE email = ?
             AND student_id != ?
             LIMIT 1`,
            [cleanEmail, studentId]
        );

        if (existingEmail.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email address is already registered"
            });
        }

        const result = await updateStudent(
            studentId,
            cleanRegistrationNo,
            cleanFirstName,
            cleanLastName,
            cleanEmail,
            cleanPhoneNumber
        );

        return res.status(200).json({
            success: true,
            message: "Student updated successfully",
            affectedRows: result.affectedRows
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            const isEmail =
                error.message &&
                error.message.toLowerCase().includes("email");

            return res.status(409).json({
                success: false,
                message: isEmail
                    ? "Email address is already registered"
                    : "Registration number is already registered"
            });
        }

        console.error("Update student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update student"
        });
    }
};

// ============================================================
// DELETE STUDENT
// ============================================================

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

// ============================================================
// GET CURRENT STUDENT'S OWN PROFILE
// ============================================================

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

// ============================================================
// CR-020: CHANGE CURRENT STUDENT'S PASSWORD
// ============================================================

const changeMyPassword = async (req, res) => {
    try {
        const userId = req.user?.userId;

        const {
            currentPassword,
            password,
            confirmPassword
        } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        if (
            typeof currentPassword !== "string" ||
            typeof password !== "string" ||
            typeof confirmPassword !== "string" ||
            !currentPassword ||
            !password ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "Please complete all password fields."
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and re-entered password do not match."
            });
        }

        const passwordError = validatePassword(password);

        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }

        const account = await getPasswordHashByUserId(userId);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        const currentPasswordMatches = await bcrypt.compare(
            currentPassword,
            account.password_hash
        );

        if (!currentPasswordMatches) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        if (
            await bcrypt.compare(password, account.password_hash)
        ) {
            return res.status(400).json({
                success: false,
                message: "New password must differ from the current password."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await updatePasswordHashByUserId(
            userId,
            passwordHash
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
        console.error("Change password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to change password. Please try again."
        });
    }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent,
    changeMyPassword
};
