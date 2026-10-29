
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("../config/db");

const {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    updateStudent,
    deleteStudent,
    getPasswordHashByUserId,
    updatePasswordHash
} = require("../models/studentModel");

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const normalizeStudentValue = (value) => {
    return typeof value === "string" ? value.trim() : "";
};

const getProfilePhotoPath = (req) => {
    return req.file
        ? `/Uploads/student/${req.file.filename}`
        : undefined;
};

// ==========================================
// CR-004: STUDENT INPUT VALIDATION
// ==========================================

const validateStudentInput = ({
    registrationNo,
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
    isCreating
}) => {
    const errors = {};

    if (!registrationNo) {
        errors.registrationNo = "Registration number is required.";
    } else if (!/^REG\d{3}$/.test(registrationNo)) {
        errors.registrationNo =
            "Registration number must be in the format REG001.";
    }

    if (!firstName) {
        errors.firstName = "First name is required.";
    } else if (firstName.length < 3) {
        errors.firstName =
            "First name must contain at least 3 characters.";
    } else if (!/^[A-Za-z]+$/.test(firstName)) {
        errors.firstName =
            "First name can contain only alphabetic characters.";
    }

    if (!lastName) {
        errors.lastName = "Last name is required.";
    } else if (lastName.length < 3) {
        errors.lastName =
            "Last name must contain at least 3 characters.";
    } else if (!/^[A-Za-z]+$/.test(lastName)) {
        errors.lastName =
            "Last name can contain only alphabetic characters.";
    }

    if (!email) {
        errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Please enter a valid email address.";
    }

    if (!phoneNumber) {
        errors.phoneNumber = "Phone number is required.";
    } else if (!/^\d{10}$/.test(phoneNumber)) {
        errors.phoneNumber =
            "Phone number must contain exactly 10 digits.";
    }

    if (isCreating) {
        if (!password) {
            errors.password =
                "Password is required for a new student.";
        } else if (password.length < 8) {
            errors.password =
                "Password must contain at least 8 characters.";
        } else if (!/[A-Z]/.test(password)) {
            errors.password =
                "Password must contain at least one uppercase letter.";
        } else if (!/[a-z]/.test(password)) {
            errors.password =
                "Password must contain at least one lowercase letter.";
        } else if (!/[0-9]/.test(password)) {
            errors.password =
                "Password must contain at least one number.";
        } else if (!/[^A-Za-z0-9]/.test(password)) {
            errors.password =
                "Password must contain at least one special character.";
        }
    }

    return errors;
};

// ==========================================
// CREATE SINGLE STUDENT
// POST /api/students/
// ==========================================

const addStudent = async (req, res) => {
    const payload = req.body || {};

    const registrationNo =
        normalizeStudentValue(payload.registrationNo);
    const firstName =
        normalizeStudentValue(payload.firstName);
    const lastName =
        normalizeStudentValue(payload.lastName);
    const email =
        normalizeStudentValue(payload.email).toLowerCase();
    const phoneNumber =
        normalizeStudentValue(payload.phoneNumber);
    const password = payload.password;

    let connection;

    try {
        const validationErrors = validateStudentInput({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            isCreating: true
        });

        if (Object.keys(validationErrors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Please correct the validation errors.",
                errors: validationErrors
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [existingUsers] = await connection.execute(
            `SELECT user_id, username, email
             FROM users
             WHERE username = ? OR email = ?`,
            [registrationNo, email]
        );

        const [existingStudents] = await connection.execute(
            `SELECT student_id, registration_no, email
             FROM students
             WHERE registration_no = ? OR email = ?`,
            [registrationNo, email]
        );

        if (
            existingUsers.some(
                user => user.username === registrationNo
            ) ||
            existingStudents.some(
                student => student.registration_no === registrationNo
            )
        ) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered.",
                errors: {
                    registrationNo:
                        "Registration number is already registered."
                }
            });
        }

        if (
            existingUsers.some(
                user => user.email?.toLowerCase() === email
            ) ||
            existingStudents.some(
                student => student.email?.toLowerCase() === email
            )
        ) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Email address is already registered.",
                errors: {
                    email: "Email address is already registered."
                }
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [userResult] = await connection.execute(
            `INSERT INTO users
                (username, email, password_hash, role)
             VALUES (?, ?, ?, 'STUDENT')`,
            [registrationNo, email, passwordHash]
        );

        const userId = userResult.insertId;
        const profilePhoto = getProfilePhotoPath(req) ?? null;

        const studentId = await createStudent(
            connection,
            userId,
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            profilePhoto
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Student account and profile created successfully.",
            student: {
                student_id: studentId,
                user_id: userId,
                registration_no: registrationNo,
                first_name: firstName,
                last_name: lastName,
                email,
                phone_number: phoneNumber,
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

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "Registration number or email is already registered."
            });
        }

        console.error("Create student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create student."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ==========================================
// CR-002: CSV BULK STUDENT IMPORT
// POST /api/students/bulk-import
// ==========================================

const bulkImportStudents = async (req, res) => {
    const inputStudents = req.body?.students;

    if (!Array.isArray(inputStudents) || inputStudents.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Please upload a CSV containing student records."
        });
    }

    if (inputStudents.length > 1000) {
        return res.status(400).json({
            success: false,
            message: "A maximum of 1000 students can be imported at once."
        });
    }

    const errors = [];
    const normalizedStudents = [];
    const seenRegistrationNumbers = new Set();
    const seenEmails = new Set();

    // STEP 1: Validate CSV rows.
    for (let index = 0; index < inputStudents.length; index++) {
        const row = inputStudents[index];
        const rowNumber = index + 2;

        if (!row || typeof row !== "object" || Array.isArray(row)) {
            errors.push({
                row: rowNumber,
                errors: ["Invalid CSV row."]
            });
            continue;
        }

        const student = {
            registrationNo: normalizeStudentValue(row.registrationNo),
            firstName: normalizeStudentValue(row.firstName),
            lastName: normalizeStudentValue(row.lastName),
            email: normalizeStudentValue(row.email).toLowerCase(),
            phoneNumber: normalizeStudentValue(row.phoneNumber)
        };

        const rowErrors = validateStudentInput({
            ...student,
            isCreating: false
        });

        const registrationKey = student.registrationNo.toUpperCase();
        const emailKey = student.email.toLowerCase();

        if (
            registrationKey &&
            seenRegistrationNumbers.has(registrationKey)
        ) {
            rowErrors.registrationNo =
                "Registration number is duplicated in this CSV.";
        }

        if (emailKey && seenEmails.has(emailKey)) {
            rowErrors.email = "Email is duplicated in this CSV.";
        }

        if (registrationKey) {
            seenRegistrationNumbers.add(registrationKey);
        }

        if (emailKey) {
            seenEmails.add(emailKey);
        }

        if (Object.keys(rowErrors).length > 0) {
            errors.push({
                row: rowNumber,
                errors: Object.values(rowErrors)
            });
        }

        normalizedStudents.push(student);
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Import cancelled. No students were added.",
            errors
        });
    }

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // STEP 2: Check database for duplicates.
        for (let index = 0; index < normalizedStudents.length; index++) {
            const student = normalizedStudents[index];
            const rowNumber = index + 2;

            const [existingUsers] = await connection.execute(
                `SELECT user_id, username, email
                 FROM users
                 WHERE username = ? OR email = ?`,
                [student.registrationNo, student.email]
            );

            const [existingProfiles] = await connection.execute(
                `SELECT student_id, registration_no, email
                 FROM students
                 WHERE registration_no = ? OR email = ?`,
                [student.registrationNo, student.email]
            );

            const rowErrors = [];

            if (
                existingUsers.some(
                    user =>
                        user.username.toLowerCase() ===
                        student.registrationNo.toLowerCase()
                ) ||
                existingProfiles.some(
                    profile =>
                        profile.registration_no.toLowerCase() ===
                        student.registrationNo.toLowerCase()
                )
            ) {
                rowErrors.push(
                    "Registration number already exists in the database."
                );
            }

            if (
                existingUsers.some(
                    user => user.email?.toLowerCase() === student.email
                ) ||
                existingProfiles.some(
                    profile => profile.email?.toLowerCase() === student.email
                )
            ) {
                rowErrors.push(
                    "Email address already exists in the database."
                );
            }

            if (rowErrors.length > 0) {
                errors.push({
                    row: rowNumber,
                    errors: rowErrors
                });
            }
        }

        if (errors.length > 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Import cancelled. No students were added.",
                errors
            });
        }

        // STEP 3: Insert user accounts and student profiles.
        for (const student of normalizedStudents) {
            const temporaryPassword =
                crypto.randomBytes(16).toString("hex") + "Aa1!";

            const passwordHash = await bcrypt.hash(
                temporaryPassword,
                10
            );

            const [userResult] = await connection.execute(
                `INSERT INTO users
                    (username, email, password_hash, role)
                 VALUES (?, ?, ?, 'STUDENT')`,
                [
                    student.registrationNo,
                    student.email,
                    passwordHash
                ]
            );

            await createStudent(
                connection,
                userResult.insertId,
                student.registrationNo,
                student.firstName,
                student.lastName,
                student.email,
                student.phoneNumber,
                null
            );
        }

        await connection.commit();

        return res.status(201).json({
            success: true,
            message:
                `Successfully added ${normalizedStudents.length} students!`,
            importedCount: normalizedStudents.length
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Bulk import rollback error:",
                    rollbackError
                );
            }
        }

        // IMPORTANT: Print the real database error in backend terminal.
        console.error("BULK IMPORT ERROR:", {
            code: error.code,
            message: error.message,
            sqlMessage: error.sqlMessage,
            sql: error.sql
        });

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "Duplicate record found. No students were added.",
                details: error.sqlMessage || error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Student import failed. No students were added.",
            details: error.sqlMessage || error.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ==========================================
// GET ALL STUDENTS
// GET /api/students/
// ==========================================

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
            message: "Failed to retrieve students."
        });
    }
};

// ==========================================
// GET STUDENT BY ID
// GET /api/students/:id
// ==========================================

const getStudent = async (req, res) => {
    try {
        const studentId = req.params.id;
        const student = await getStudentById(studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
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
            message: "Failed to retrieve student."
        });
    }
};

// ==========================================
// UPDATE STUDENT
// PUT /api/students/:id
// ==========================================

const editStudent = async (req, res) => {
    let connection;

    try {
        const studentId = req.params.id;
        const body = req.body || {};

        const registrationNo =
            normalizeStudentValue(body.registrationNo);
                      
        const firstName = normalizeStudentValue(body.firstName);
        const lastName = normalizeStudentValue(body.lastName);
        const email = normalizeStudentValue(body.email).toLowerCase();
        const phoneNumber = normalizeStudentValue(body.phoneNumber);

        const validationErrors = validateStudentInput({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            isCreating: false
        });

        if (Object.keys(validationErrors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Please correct the validation errors.",
                errors: validationErrors
            });
        }

        const existingStudent = await getStudentById(studentId);

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [existingUsers] = await connection.execute(
            `SELECT user_id, username, email
             FROM users
             WHERE username = ?
               AND user_id <> ?`,
            [registrationNo, existingStudent.user_id]
        );

        const [existingStudentProfiles] = await connection.execute(
            `SELECT student_id, registration_no, email
             FROM students
             WHERE (registration_no = ? OR email = ?)
               AND student_id <> ?`,
            [registrationNo, email, studentId]
        );

        const [existingAccountEmails] = await connection.execute(
            `SELECT user_id
             FROM users
             WHERE email = ?
               AND user_id <> ?`,
            [email, existingStudent.user_id]
        );

        if (
            existingUsers.length > 0 ||
            existingStudentProfiles.some(
                profile => profile.registration_no === registrationNo
            )
        ) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered.",
                errors: {
                    registrationNo:
                        "Registration number is already registered."
                }
            });
        }

        if (
            existingStudentProfiles.some(
                profile => profile.email?.toLowerCase() === email
            ) ||
            existingAccountEmails.length > 0
        ) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Email address is already registered.",
                errors: {
                    email: "Email address is already registered."
                }
            });
        }

        await connection.execute(
            `UPDATE users
             SET username = ?, email = ?
             WHERE user_id = ?`,
            [registrationNo, email, existingStudent.user_id]
        );

        const newProfilePhoto = getProfilePhotoPath(req);

        let updateQuery;
        let updateValues;

        if (newProfilePhoto !== undefined) {
            updateQuery = `
                UPDATE students
                SET registration_no = ?,
                    first_name = ?,
                    last_name = ?,
                    email = ?,
                    phone_number = ?,
                    profile_photo = ?
                WHERE student_id = ?
            `;

            updateValues = [
                registrationNo,
                firstName,
                lastName,
                email,
                phoneNumber,
                newProfilePhoto,
                studentId
            ];
        } else {
            updateQuery = `
                UPDATE students
                SET registration_no = ?,
                    first_name = ?,
                    last_name = ?,
                    email = ?,
                    phone_number = ?
                WHERE student_id = ?
            `;

            updateValues = [
                registrationNo,
                firstName,
                lastName,
                email,
                phoneNumber,
                studentId
            ];
        }

        const [result] = await connection.execute(
            updateQuery,
            updateValues
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Student updated successfully.",
            affectedRows: result.affectedRows
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Update rollback error:", rollbackError);
            }
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "Registration number or email is already registered."
            });
        }

        console.error("Update student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update student."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ==========================================
// DELETE STUDENT
// DELETE /api/students/:id
// ==========================================

const removeStudent = async (req, res) => {
    try {
        const studentId = req.params.id;
        const student = await getStudentById(studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        const result = await deleteStudent(studentId);

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

// ==========================================
// GET CURRENT STUDENT PROFILE
// GET /api/students/me
// ==========================================

const getMyProfile = async (req, res) => {
    try {
        const student = await getStudentByUserId(req.user.userId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found."
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
            message: "Failed to retrieve profile."
        });
    }
};

// ==========================================
// CR-020: CHANGE STUDENT PASSWORD
// PATCH /api/students/change-password
// ==========================================

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
                message: "Please fill in all password fields."
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must contain at least 8 characters."
            });
        }

        if (
            !/[A-Z]/.test(newPassword) ||
            !/[a-z]/.test(newPassword) ||
            !/[0-9]/.test(newPassword) ||
            !/[^A-Za-z0-9]/.test(newPassword)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must contain uppercase, lowercase, number and special character."
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New passwords do not match."
            });
        }

        const userId = req.user.userId;
        const user = await getPasswordHashByUserId(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User account not found."
            });
        }

        const isCurrentPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password_hash
        );

        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        const isSamePassword = await bcrypt.compare(
            newPassword,
            user.password_hash
        );

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be different from the current password."
            });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        const result = await updatePasswordHash(
            userId,
            newPasswordHash
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
        console.error("Change password error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to change password."
        });
    }
};

// CR-019: Update the authenticated student's own email and phone number.
const updateMyProfile = async (req, res) => {
    const email =
        typeof req.body?.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";
    const phoneNumber =
        typeof req.body?.phoneNumber === "string"
            ? req.body.phoneNumber.trim()
            : "";
    const errors = {};

    if (!email) {
        errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Please enter a valid email address.";
    }

    if (!phoneNumber) {
        errors.phoneNumber = "Phone number is required.";
    } else if (!/^\d{10}$/.test(phoneNumber)) {
        errors.phoneNumber =
            "Phone number must contain exactly 10 digits.";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            message: "Please correct the validation errors.",
            errors
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        const userId = req.user.userId;
        const existingStudent = await getStudentByUserId(userId);

        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found."
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [existingUsers] = await connection.execute(
            `SELECT user_id
             FROM users
             WHERE email = ?
               AND user_id <> ?`,
            [email, userId]
        );
        const [existingStudents] = await connection.execute(
            `SELECT student_id
             FROM students
             WHERE email = ?
               AND student_id <> ?`,
            [email, existingStudent.student_id]
        );

        if (existingUsers.length > 0 || existingStudents.length > 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(409).json({
                success: false,
                message: "Email address is already registered.",
                errors: {
                    email: "Email address is already registered."
                }
            });
        }

        await connection.execute(
            `UPDATE users
             SET email = ?
             WHERE user_id = ?`,
            [email, userId]
        );
        await connection.execute(
            `UPDATE students
             SET email = ?, phone_number = ?
             WHERE student_id = ?`,
            [email, phoneNumber, existingStudent.student_id]
        );

        await connection.commit();
        transactionStarted = false;

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            student: {
                ...existingStudent,
                email,
                phone_number: phoneNumber
            }
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Profile update rollback error:", rollbackError);
            }
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Email address is already registered."
            });
        }

        console.error("Update my profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update profile."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


module.exports = {
    addStudent,
    bulkImportStudents,
    getStudents,
    getStudent,
    getMyProfile,
    updateMyProfile,
    editStudent,
    removeStudent,
    changeMyPassword
};
