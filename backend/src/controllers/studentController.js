
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

const {
    getPasswordHashByUserId,
    updatePasswordHash
} = require("../models/userModel");


// =====================================================
// COMMON VALIDATION HELPERS
// =====================================================

const normalizeStudentValue = (value) => {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
};

const isValidRegistrationNumber = (value) => {
    const normalized = normalizeStudentValue(value);

    return /^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/.test(normalized);
};

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
    const phone = String(phoneNumber ?? "").trim();

    if (!phone) {
        return "Phone number is required";
    }

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

    if (!/[^A-Za-z0-9]/.test(password)) {
        return "Password must contain at least one special character";
    }

    return null;
};

// =====================================================
// CR-015: IMPORT MULTIPLE STUDENTS FROM CSV DATA
// POST /api/students/import-csv
// =====================================================

const importStudents = async (req, res) => {
    const students = req.body?.students;

    if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Provide at least one student record."
        });
    }

    if (students.length > 500) {
        return res.status(400).json({
            success: false,
            message: "A maximum of 500 students can be imported per request."
        });
    }

    const results = [];
    let imported = 0;
    let rejected = 0;

    // Detect duplicates inside the uploaded file as well as in MySQL.
    const seenRegistrationNumbers = new Set();
    const seenEmails = new Set();

    for (let index = 0; index < students.length; index++) {
        const row = students[index];
        const rowNumber = index + 2;
        let connection;

        try {
            if (!row || typeof row !== "object" || Array.isArray(row)) {
                results.push({
                    row: rowNumber,
                    status: "rejected",
                    errors: ["Invalid student record."]
                });

                rejected++;
                continue;
            }

            const registrationNo =
                normalizeStudentValue(row.registrationNo);

            const firstName =
                normalizeStudentValue(row.firstName);

            const lastName =
                normalizeStudentValue(row.lastName);

            const email =
                normalizeStudentValue(row.email);

            const phoneNumber =
                normalizeStudentValue(row.phoneNumber);

            const password = row.password;
            const errors = [];

            if (!isValidRegistrationNumber(registrationNo)) {
                errors.push(
                    "Registration number must contain letters, numbers, hyphens, or underscores."
                );
            }

            const firstNameError = validateName(firstName, "First name");
            if (firstNameError) errors.push(firstNameError);

            const lastNameError = validateName(lastName, "Last name");
            if (lastNameError) errors.push(lastNameError);

            const emailError = validateEmail(email);
            if (emailError) errors.push(emailError);

            const phoneError = validatePhoneNumber(phoneNumber);
            if (phoneError) errors.push(phoneError);

            const passwordError = validatePassword(password);
            if (passwordError) errors.push(passwordError);

            const normalizedRegistration = registrationNo.toLowerCase();
            const normalizedEmail = email.toLowerCase();

            if (
                normalizedRegistration &&
                seenRegistrationNumbers.has(normalizedRegistration)
            ) {
                errors.push(
                    "Registration number is duplicated in this CSV file."
                );
            }

            if (
                normalizedEmail &&
                seenEmails.has(normalizedEmail)
            ) {
                errors.push(
                    "Email address is duplicated in this CSV file."
                );
            }

            if (normalizedRegistration) {
                seenRegistrationNumbers.add(normalizedRegistration);
            }

            if (normalizedEmail) {
                seenEmails.add(normalizedEmail);
            }

            if (errors.length > 0) {
                results.push({
                    row: rowNumber,
                    registrationNo,
                    status: "rejected",
                    errors
                });

                rejected++;
                continue;
            }

            connection = await pool.getConnection();
            await connection.beginTransaction();

            const [existingUser] = await connection.execute(
                `SELECT user_id
                 FROM users
                 WHERE username = ?
                 LIMIT 1`,
                [registrationNo]
            );

            if (existingUser.length > 0) {
                await connection.rollback();

                results.push({
                    row: rowNumber,
                    registrationNo,
                    status: "rejected",
                    errors: [
                        "Registration number is already registered."
                    ]
                });

                rejected++;
                continue;
            }

            const [existingStudent] = await connection.execute(
                `SELECT student_id
                 FROM students
                 WHERE email = ?
                 LIMIT 1`,
                [email]
            );

            if (existingStudent.length > 0) {
                await connection.rollback();

                results.push({
                    row: rowNumber,
                    registrationNo,
                    status: "rejected",
                    errors: [
                        "Email address is already registered."
                    ]
                });

                rejected++;
                continue;
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const [userResult] = await connection.execute(
                `INSERT INTO users (username, password_hash, role)
                 VALUES (?, ?, 'STUDENT')`,
                [registrationNo, passwordHash]
            );

            const studentId = await createStudent(
                connection,
                userResult.insertId,
                registrationNo,
                firstName,
                lastName,
                email,
                phoneNumber
            );

            await connection.commit();

            results.push({
                row: rowNumber,
                registrationNo,
                studentId,
                status: "imported",
                message: "Student created successfully."
            });

            imported++;
        } catch (error) {
            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        "CSV import rollback error:",
                        rollbackError.message
                    );
                }
            }

            console.error(
                `CSV import error on row ${rowNumber}:`,
                error.message
            );

            results.push({
                row: rowNumber,
                registrationNo:
                    typeof row?.registrationNo === "string"
                        ? row.registrationNo.trim()
                        : "",
                status: "rejected",
                errors: [
                    error.code === "ER_DUP_ENTRY"
                        ? "Registration number or email is already registered."
                        : "The student could not be imported."
                ]
            });

            rejected++;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    return res.status(200).json({
        success: imported > 0,
        message: `Import completed: ${imported} imported, ${rejected} rejected.`,
        summary: {
            total: students.length,
            imported,
            rejected
        },
        results
    });
};

// =====================================================
// CREATE STUDENT
// POST /api/students
// =====================================================

const addStudent = async (req, res) => {
    const payload = {
        registrationNo: normalizeStudentValue(req.body.registrationNo),
        firstName: normalizeStudentValue(req.body.firstName),
        lastName: normalizeStudentValue(req.body.lastName),
        email: normalizeStudentValue(req.body.email),
        phoneNumber: normalizeStudentValue(req.body.phoneNumber),
        password: req.body.password
    };

    const {
        registrationNo,
        firstName,
        lastName,
        email,
        phoneNumber,
        password
    } = payload;

    let connection;

    try {
        const validation = validateStudentData(payload, false);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.firstError,
                errors: validation.errors
            });
        }

        const registrationError = isValidRegistrationNumber(registrationNo)
            ? null
            : "Registration number must contain only letters, numbers, hyphen, or underscore.";

        const firstNameError = validateName(firstName, "First name");
        const lastNameError = validateName(lastName, "Last name");
        const emailError = validateEmail(email);
        const phoneError = validatePhoneNumber(phoneNumber);
        const passwordError = validatePassword(password);

        const errors = [
            registrationError,
            firstNameError,
            lastNameError,
            emailError,
            phoneError,
            passwordError
        ].filter(Boolean);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: errors[0],
                errors
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [existingUser] = await connection.execute(
            `SELECT user_id FROM users WHERE username = ? LIMIT 1`,
            [registrationNo]
        );

        if (existingUser.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered"
            });
        }

        const [existingStudent] = await connection.execute(
            `SELECT student_id FROM students WHERE email = ? LIMIT 1`,
            [email]
        );

        if (existingStudent.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Email address is already registered"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [userResult] = await connection.execute(
            `INSERT INTO users (username, password_hash, role)
             VALUES (?, ?, 'STUDENT')`,
            [registrationNo, passwordHash]
        );

        const userId = userResult.insertId;

        const studentId = await createStudent(
            connection,
            userId,
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        );

        await connection.commit();

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
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Transaction rollback error:", rollbackError.message);
            }
        }

        console.error("Create student error:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Registration number or email is already registered"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create student"
        });
    } finally {
        if (connection) connection.release();
    }
};

// =====================================================
// GET ALL STUDENTS
// =====================================================

const getStudents = async (req, res) => {
    try {
        const students = await getAllStudents();

        return res.status(200).json({
            success: true,
            count: students.length,
            students
        });
    } catch (error) {
        console.error("Get students error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve students"
        });
    }
};

// =====================================================
// GET STUDENT BY ID
// =====================================================

const getStudent = async (req, res) => {
    try {
        const student = await getStudentById(req.params.id);

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
        console.error("Get student error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve student"
        });
    }
};

// =====================================================
// UPDATE STUDENT
// =====================================================

const editStudent = async (req, res) => {
    try {
        const studentId = req.params.id;

        const payload = {
            registrationNo: normalizeStudentValue(req.body.registrationNo),
            firstName: normalizeStudentValue(req.body.firstName),
            lastName: normalizeStudentValue(req.body.lastName),
            email: normalizeStudentValue(req.body.email),
            phoneNumber: normalizeStudentValue(req.body.phoneNumber)
        };

        const validation = validateStudentData(payload, true);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.firstError,
                errors: validation.errors
            });
        }

        const errors = [
            isValidRegistrationNumber(payload.registrationNo)
                ? null
                : "Registration number must contain only letters, numbers, hyphen, or underscore.",
            validateName(payload.firstName, "First name"),
            validateName(payload.lastName, "Last name"),
            validateEmail(payload.email),
            validatePhoneNumber(payload.phoneNumber)
        ].filter(Boolean);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: errors[0],
                errors
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
            payload.registrationNo,
            payload.firstName,
            payload.lastName,
            payload.email,
            payload.phoneNumber
        );

        return res.status(200).json({
            success: true,
            message: "Student updated successfully",
            affectedRows: result.affectedRows
        });
    } catch (error) {
        console.error("Update student error:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Email address or registration number is already registered"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update student"
        });
    }
};

// =====================================================
// DELETE STUDENT
// =====================================================

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
        console.error("Delete student error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to delete student"
        });
    }
};

// =====================================================
// GET LOGGED-IN STUDENT PROFILE
// =====================================================

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
        console.error("Get my profile error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve profile"
        });
    }
};

// =====================================================
// CR-020: CHANGE STUDENT PASSWORD
// =====================================================

const changeMyPassword = async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body || {};

        if (
            typeof currentPassword !== "string" ||
            !currentPassword ||
            typeof newPassword !== "string" ||
            !newPassword ||
            typeof confirmPassword !== "string" ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required"
            });
        }

        const passwordError = validatePassword(newPassword);

        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirmation password do not match"
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password"
            });
        }

        const userId = req.user.userId;
        const account = await getPasswordHashByUserId(userId);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Student account not found"
            });
        }

        const matches = await bcrypt.compare(
            currentPassword,
            account.password_hash
        );

        if (!matches) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        const result = await updatePasswordHash(
            userId,
            newPasswordHash
        );

        if (!result.affectedRows) {
            return res.status(500).json({
                success: false,
                message: "Password could not be updated"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        console.error("Change student password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to change password"
        });
    }
};

// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent,
    changeMyPassword,
    importStudents
};
