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


    // Registration number
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


    // Phone must contain numbers only
    if (!/^\d+$/.test(phone)) {
        return "Phone number must contain numeric characters only.";
    }


    // Phone exactly 10 digits
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

        // ----------------------------------------------------
        // CR-004 SERVER-SIDE INPUT VALIDATION
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // CR-004 STRONG PASSWORD VALIDATION
        // ----------------------------------------------------

        const passwordError = validatePassword(password);


        if (passwordError) {

            return res.status(400).json({
                success: false,
                message: passwordError
            });

        }


        // Clean values
        const cleanRegistrationNo = registrationNo.trim();
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim();
        const cleanPhoneNumber = phoneNumber.trim();


        // ----------------------------------------------------
        // GET DATABASE CONNECTION
        // ----------------------------------------------------

        connection = await pool.getConnection();


        // Start transaction
        await connection.beginTransaction();


        // ----------------------------------------------------
        // CHECK DUPLICATE REGISTRATION NUMBER
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
        // CHECK DUPLICATE EMAIL
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
        // HASH PASSWORD
        // Existing bcrypt mechanism preserved
        // ----------------------------------------------------

        const passwordHash = await bcrypt.hash(password, 10);


        // ----------------------------------------------------
        // CREATE USER ACCOUNT
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
        // CREATE STUDENT PROFILE
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


        // Commit transaction
        await connection.commit();


        // ----------------------------------------------------
        // SUCCESS
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


        // ----------------------------------------------------
        // CR-004 SERVER-SIDE VALIDATION FOR EDIT
        // ----------------------------------------------------

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


        // Clean values
        const cleanRegistrationNo = registrationNo.trim();
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim();
        const cleanPhoneNumber = phoneNumber.trim();


        // ----------------------------------------------------
        // CHECK STUDENT EXISTS
        // ----------------------------------------------------

        const existingStudent = await getStudentById(studentId);


        if (!existingStudent) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });

        }


        // ----------------------------------------------------
        // UPDATE STUDENT
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


// ============================================================
// DELETE STUDENT
// DELETE /api/students/:id
// ============================================================

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