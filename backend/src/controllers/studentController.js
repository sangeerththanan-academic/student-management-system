
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


// ============================================================
// VALIDATION FUNCTION
// Used by both CREATE and UPDATE
// ============================================================

const validateStudentInput = ({
    registrationNo,
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
    isCreating = false
}) => {

    // --------------------------------------------------------
    // Convert values safely to strings
    // --------------------------------------------------------

    const registration = String(registrationNo || "").trim();
    const first = String(firstName || "").trim();
    const last = String(lastName || "").trim();
    const emailValue = String(email || "").trim();
    const phone = String(phoneNumber || "").trim();


    // --------------------------------------------------------
    // Required fields
    // --------------------------------------------------------

    if (!registration) {
        return "Registration number is required.";
    }

    if (!first) {
        return "First name is required.";
    }

    if (!last) {
        return "Last name is required.";
    }

    if (!emailValue) {
        return "Email address is required.";
    }

    if (!phone) {
        return "Phone number is required.";
    }


    // --------------------------------------------------------
    // Registration Number
    // --------------------------------------------------------

    // Allows values such as:
    // JF/ICT/24/10
    // JF-ICT-24-10
    // ICT2410

    const registrationPattern = /^[A-Za-z0-9/-]+$/;

    if (!registrationPattern.test(registration)) {

        return "Registration number contains invalid characters.";
    }


    // --------------------------------------------------------
    // First Name
    // --------------------------------------------------------

    if (first.length < 3) {

        return "First name must contain at least 3 characters.";
    }


    // Allows alphabetic names with spaces, apostrophe or hyphen
    // Examples:
    // John
    // John Doe
    // Anne-Marie
    // O'Connor

    const namePattern = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

    if (!namePattern.test(first)) {

        return "First name can contain alphabetic characters only.";
    }


    // --------------------------------------------------------
    // Last Name
    // --------------------------------------------------------

    if (last.length < 3) {

        return "Last name must contain at least 3 characters.";
    }

    if (!namePattern.test(last)) {

        return "Last name can contain alphabetic characters only.";
    }


    // --------------------------------------------------------
    // Email
    // --------------------------------------------------------

    const emailPattern =
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailPattern.test(emailValue)) {

        return "Please enter a valid email address.";
    }


    // --------------------------------------------------------
    // Phone Number
    // --------------------------------------------------------

    if (!/^\d+$/.test(phone)) {

        return "Phone number must contain numeric characters only.";
    }


    if (phone.length !== 10) {

        return "Phone number must contain exactly 10 digits.";
    }


    // --------------------------------------------------------
    // Password
    // Required only during CREATE
    // --------------------------------------------------------

    if (isCreating) {

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
    }


    // --------------------------------------------------------
    // Validation passed
    // --------------------------------------------------------

    return null;
};


// ============================================================
// CREATE STUDENT
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

        // ----------------------------------------------------
        // SERVER-SIDE VALIDATION
        // ----------------------------------------------------

        const validationError = validateStudentInput({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            isCreating: true
        });


        if (validationError) {

            return res.status(400).json({
                success: false,
                message: validationError
            });
        }


        // ----------------------------------------------------
        // Clean values
        // ----------------------------------------------------

        const cleanRegistrationNo = registrationNo.trim();
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim();
        const cleanPhoneNumber = phoneNumber.trim();


        // ----------------------------------------------------
        // Database connection
        // ----------------------------------------------------

        connection = await pool.getConnection();

        await connection.beginTransaction();


        // ----------------------------------------------------
        // Check duplicate registration number
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // Check duplicate email
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // Hash password
        // ----------------------------------------------------

        const passwordHash = await bcrypt.hash(password, 10);


        // ----------------------------------------------------
        // Create user account
        // ----------------------------------------------------

        const [userResult] = await connection.execute(
            `INSERT INTO users
            (
                username,
                password_hash,
                role
            )
            VALUES (?, ?, 'STUDENT')`,
            [
                cleanRegistrationNo,
                passwordHash
            ]
        );


        const userId = userResult.insertId;


        // ----------------------------------------------------
        // Create student profile
        // ----------------------------------------------------

        const studentId = await createStudent(
            connection,
            userId,
            cleanRegistrationNo,
            cleanFirstName,
            cleanLastName,
            cleanEmail,
            cleanPhoneNumber
        );


        // ----------------------------------------------------
        // Commit
        // ----------------------------------------------------

        await connection.commit();


        // ----------------------------------------------------
        // Success
        // ----------------------------------------------------

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
            await connection.rollback();
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

        const {
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        } = req.body;


        // ----------------------------------------------------
        // SERVER-SIDE VALIDATION
        // Password is NOT required during Edit
        // ----------------------------------------------------

        const validationError = validateStudentInput({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            isCreating: false
        });


        if (validationError) {

            return res.status(400).json({
                success: false,
                message: validationError
            });
        }


        // ----------------------------------------------------
        // Clean values
        // ----------------------------------------------------

        const cleanRegistrationNo = registrationNo.trim();
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim();
        const cleanPhoneNumber = phoneNumber.trim();


        // ----------------------------------------------------
        // Check student exists
        // ----------------------------------------------------

        const existingStudent = await getStudentById(studentId);

        if (!existingStudent) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }


        // ----------------------------------------------------
        // Check duplicate registration number
        // ----------------------------------------------------

        const [existingRegistration] = await pool.execute(
            `SELECT student_id
             FROM students
             WHERE registration_no = ?
             AND student_id <> ?
             LIMIT 1`,
            [
                cleanRegistrationNo,
                studentId
            ]
        );


        if (existingRegistration.length > 0) {

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered"
            });
        }


        // ----------------------------------------------------
        // Check duplicate email
        // ----------------------------------------------------

        const [existingEmail] = await pool.execute(
            `SELECT student_id
             FROM students
             WHERE email = ?
             AND student_id <> ?
             LIMIT 1`,
            [
                cleanEmail,
                studentId
            ]
        );


        if (existingEmail.length > 0) {

            return res.status(409).json({
                success: false,
                message: "Email address is already registered"
            });
        }


        // ----------------------------------------------------
        // Update student
        // ----------------------------------------------------

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
// EXPORT
// ============================================================

module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent
};
