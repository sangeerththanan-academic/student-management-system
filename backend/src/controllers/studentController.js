const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    updateStudent
} = require("../models/studentModel");

// ============================================================
// CR-004 VALIDATION FUNCTIONS
// ============================================================

const validateStudentInput = ({
    registrationNo,
    firstName,
    lastName,
    email,
    phoneNumber
}) => {
    const registration = String(registrationNo || "").trim();
    const first = String(firstName || "").trim();
    const last = String(lastName || "").trim();
    const emailAddress = String(email || "").trim();
    const phone = String(phoneNumber || "").trim();

    // Required fields
    if (
        !registration ||
        !first ||
        !last ||
        !emailAddress ||
        !phone
    ) {
        return "All student fields are required.";
    }

    // Registration number validation
    if (!/^[A-Za-z0-9]+$/.test(registration)) {
        return "Registration number can contain only letters and numbers.";
    }

    // First name minimum length
    if (first.length < 3) {
        return "First name must contain at least 3 characters.";
    }

    // Last name minimum length
    if (last.length < 3) {
        return "Last name must contain at least 3 characters.";
    }

    // Name validation
    const namePattern = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;

    if (!namePattern.test(first)) {
        return "First name can contain only alphabetic characters.";
    }

    if (!namePattern.test(last)) {
        return "Last name can contain only alphabetic characters.";
    }

    // Email validation
    const emailPattern =
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailPattern.test(emailAddress)) {
        return "Please enter a valid email address.";
    }

    // Phone number validation
    if (!/^\d+$/.test(phone)) {
        return "Phone number must contain numeric characters only.";
    }

    // Phone number must contain exactly 10 digits
    if (phone.length !== 10) {
        return "Phone number must contain exactly 10 digits.";
    }

    return null;
};

// ============================================================
// CR-004 PASSWORD VALIDATION
// ============================================================

const validatePassword = (password) => {
    if (!password) {
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

// ============================================================
// CREATE STUDENT
// POST /api/students/
// ============================================================

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
        // Server-side input validation
        const validationError = validateStudentInput({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        });

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        // Strong password validation
        const passwordError = validatePassword(password);

        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }

        // Clean input values
        const cleanRegistrationNo = registrationNo.trim();
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim();
        const cleanPhoneNumber = phoneNumber.trim();

        // Get database connection
        connection = await pool.getConnection();

        // Start transaction
        await connection.beginTransaction();

        // Check duplicate registration number
        const [existingUser] = await connection.execute(
            `SELECT user_id
             FROM users
             WHERE username = ?
             LIMIT 1`,
            [cleanRegistrationNo]
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
            [cleanEmail]
        );

        if (existingStudent.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Email address is already registered"
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user account
        const [userResult] = await connection.execute(
            `INSERT INTO users
                (username, password_hash, role)
             VALUES (?, ?, 'STUDENT')`,
            [
                cleanRegistrationNo,
                passwordHash
            ]
        );

        const userId = userResult.insertId;

        // Create student profile

const profilePhoto = req.file
  ? `/uploads/students/${req.file.filename}`
  : null;

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


        // Commit transaction
        await connection.commit();

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
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Create student rollback error:",
                    rollbackError
                );
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
// GET /api/students/:id
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
// PUT /api/students/:id
// ============================================================

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

        // Validate student input
        const validationError = validateStudentInput({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        });

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        // Clean input values
        const cleanRegistrationNo = registrationNo.trim();
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim();
        const cleanPhoneNumber = phoneNumber.trim();

        // Check student exists
        const existingStudent = await getStudentById(studentId);

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Update student
       
const profilePhoto = req.file
  ? `/uploads/students/${req.file.filename}`
  : undefined;

const result = await updateStudent(
  studentId,
  cleanRegistrationNo,
  cleanFirstName,
  cleanLastName,
  cleanEmail,
  cleanPhoneNumber,
  profilePhoto
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
// DELETE /api/students/:id
//
// Deletes the student profile and associated STUDENT user account
// within one transaction.
// ============================================================

const removeStudent = async (req, res) => {
    let connection;

    try {
        const studentId = req.params.id;

        connection = await pool.getConnection();

        // Start transaction
        await connection.beginTransaction();

        // Find student and associated user account
        const [students] = await connection.execute(
            `SELECT student_id, user_id
             FROM students
             WHERE student_id = ?
             FOR UPDATE`,
            [studentId]
        );

        if (students.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const { user_id: userId } = students[0];

        // Delete student profile first
        const [studentResult] = await connection.execute(
            `DELETE FROM students
             WHERE student_id = ?`,
            [studentId]
        );

        if (studentResult.affectedRows !== 1) {
            throw new Error("Student profile could not be deleted");
        }

        // Delete associated user account
        const [userResult] = await connection.execute(
            `DELETE FROM users
             WHERE user_id = ?
               AND role = 'STUDENT'`,
            [userId]
        );

        if (userResult.affectedRows !== 1) {
            throw new Error("Student user account could not be deleted");
        }

        // Commit both deletions
        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Student profile and user account deleted successfully",
            studentId: Number(studentId),
            userId
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Delete student rollback error:",
                    rollbackError
                );
            }
        }

        console.error("Delete student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete student and user account"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ============================================================
// GET CURRENT STUDENT PROFILE
// ============================================================

const getMyProfile = async (req, res) => {
    try {
        const student = await getStudentByUserId(
            req.user.userId
        );

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
// EXPORTS
// ============================================================

module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent
};