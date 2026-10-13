
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

// -------------------- VALIDATION --------------------

const validateName = (name, fieldName) => {
    if (typeof name !== "string" || !name.trim()) {
        return `${fieldName} is required`;
    }

    if (name.trim().length < 3) {
        return `${fieldName} must contain at least 3 characters`;
    }

    if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name.trim())) {
        return `${fieldName} must contain only letters and spaces`;
    }

    return null;
};

const validateEmail = (email) => {
    if (typeof email !== "string" || !email.trim()) {
        return "Email address is required";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return "Please enter a valid email address";
    }

    return null;
};

const validatePhoneNumber = (phoneNumber) => {
    if (
        phoneNumber === undefined ||
        phoneNumber === null ||
        !String(phoneNumber).trim()
    ) {
        return "Phone number is required";
    }

    const phone = String(phoneNumber).trim();

    if (!/^\d{10}$/.test(phone)) {
        return "Phone number must contain exactly 10 digits";
    }

    return null;
};

const validatePassword = (password) => {
    if (typeof password !== "string" || !password) {
        return "Password is required";
    }

    if (password.length < 8) {
        return "Password must be at least 8 characters";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter";
    }

    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter";
    }

    if (!/\d/.test(password)) {
        return "Password must contain at least one number";
    }

    if (!/[@$!%*?&]/.test(password)) {
        return "Password must contain at least one special character";
    }

    return null;
};

// -------------------- ADD STUDENT --------------------

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
            typeof registrationNo !== "string" ||
            !registrationNo.trim() ||
            typeof firstName !== "string" ||
            !firstName.trim() ||
            typeof lastName !== "string" ||
            !lastName.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            phoneNumber === undefined ||
            phoneNumber === null ||
            !String(phoneNumber).trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "All student fields and password are required"
            });
        }

        const cleanRegistrationNo = registrationNo.trim();
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim();
        const cleanPhoneNumber = String(phoneNumber).trim();

        const firstNameError = validateName(cleanFirstName, "First name");

        if (firstNameError) {
            return res.status(400).json({
                success: false,
                message: firstNameError
            });
        }

        const lastNameError = validateName(cleanLastName, "Last name");

        if (lastNameError) {
            return res.status(400).json({
                success: false,
                message: lastNameError
            });
        }

        const emailError = validateEmail(cleanEmail);

        if (emailError) {
            return res.status(400).json({
                success: false,
                message: emailError
            });
        }

        const phoneError = validatePhoneNumber(cleanPhoneNumber);

        if (phoneError) {
            return res.status(400).json({
                success: false,
                message: phoneError
            });
        }

        const passwordError = validatePassword(password);

        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }

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
            `INSERT INTO users
                (username, password_hash, role)
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
            cleanPhoneNumber
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

// -------------------- GET ALL STUDENTS --------------------

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

// -------------------- GET STUDENT BY ID --------------------

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

// -------------------- UPDATE STUDENT --------------------

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
            typeof registrationNo !== "string" ||
            !registrationNo.trim() ||
            typeof firstName !== "string" ||
            !firstName.trim() ||
            typeof lastName !== "string" ||
            !lastName.trim() ||
            typeof email !== "string" ||
            !email.trim() ||
            phoneNumber === undefined ||
            phoneNumber === null ||
            !String(phoneNumber).trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "All student fields are required"
            });
        }

        const cleanRegistrationNo = registrationNo.trim();
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim();
        const cleanPhoneNumber = String(phoneNumber).trim();

        const firstNameError = validateName(cleanFirstName, "First name");

        if (firstNameError) {
            return res.status(400).json({
                success: false,
                message: firstNameError
            });
        }

        const lastNameError = validateName(cleanLastName, "Last name");

        if (lastNameError) {
            return res.status(400).json({
                success: false,
                message: lastNameError
            });
        }

        const emailError = validateEmail(cleanEmail);

        if (emailError) {
            return res.status(400).json({
                success: false,
                message: emailError
            });
        }

        const phoneError = validatePhoneNumber(cleanPhoneNumber);

        if (phoneError) {
            return res.status(400).json({
                success: false,
                message: phoneError
            });
        }

        const existingStudent = await getStudentById(studentId);

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
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
        console.error("Update student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update student"
        });
    }
};

// -------------------- DELETE STUDENT --------------------

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

// -------------------- GET MY PROFILE --------------------

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

// -------------------- EXPORT CONTROLLERS --------------------

module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent
};
