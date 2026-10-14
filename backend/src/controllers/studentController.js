// const bcrypt = require("bcryptjs");
// const fs = require("fs");
// const path = require("path");

// const pool = require("../config/db");

// const {
//     createStudent,
//     getAllStudents,
//     getStudentById,
//     getStudentByUserId,
//     deleteStudent
// } = require("../models/studentModel");

// const uploadDirectory = path.resolve(
//     __dirname,
//     "../../uploads/students"
// );

// const validateStudentInput = (data, isEditing = false) => {
//     const errors = {};

//     const {
//         registrationNo,
//         firstName,
//         lastName,
//         email,
//         phoneNumber,
//         password
//     } = data;

//     if (
//         typeof registrationNo !== "string" ||
//         !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{5,20}$/.test(
//             registrationNo.trim()
//         )
//     ) {
//         errors.registrationNo =
//             "Registration number must contain 5–20 letters and numbers, e.g. REG009.";
//     }

//     if (
//         typeof firstName !== "string" ||
//         !/^[A-Za-z]{3,}$/.test(firstName.trim())
//     ) {
//         errors.firstName = "First name must contain at least 3 English letters.";
//     }

//     if (
//         typeof lastName !== "string" ||
//         !/^[A-Za-z]{3,}$/.test(lastName.trim())
//     ) {
//         errors.lastName = "Last name must contain at least 3 English letters.";
//     }

//     if (
//         typeof email !== "string" ||
//         !/^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(email.trim())
//     ) {
//         errors.email = "Enter a valid Gmail address ending in @gmail.com.";
//     }

//     if (
//         typeof phoneNumber !== "string" ||
//         !/^\d{10}$/.test(phoneNumber.trim())
//     ) {
//         errors.phoneNumber = "Phone number must contain exactly 10 digits.";
//     }

//     if (!isEditing || password !== undefined) {
//         if (typeof password !== "string" || password.length < 8) {
//             errors.password = "Password must contain at least 8 characters.";
//         } else if (!/[A-Z]/.test(password)) {
//             errors.password = "Password must contain an uppercase letter.";
//         } else if (!/[a-z]/.test(password)) {
//             errors.password = "Password must contain a lowercase letter.";
//         } else if (!/\d/.test(password)) {
//             errors.password = "Password must contain a number.";
//         } else if (!/[^A-Za-z0-9]/.test(password)) {
//             errors.password = "Password must contain a special character.";
//         }
//     }

//     return errors;
// };

// const removeUploadedFile = (file) => {
//     if (!file?.path) return;

//     fs.unlink(file.path, (error) => {
//         if (error && error.code !== "ENOENT") {
//             console.error("Failed to remove uploaded image:", error);
//         }
//     });
// };

// const removeOldProfileImage = (imageUrl) => {
//     if (!imageUrl) return;

//     // Only delete files inside the student upload directory.
//     const filename = path.basename(
//         String(imageUrl).replace(/\\/g, "/")
//     );

//     if (!filename || filename === "." || filename === "..") return;

//     const imagePath = path.join(uploadDirectory, filename);

//     if (path.dirname(imagePath) !== uploadDirectory) return;

//     fs.unlink(imagePath, (error) => {
//         if (error && error.code !== "ENOENT") {
//             console.error("Failed to remove old profile image:", error);
//         }
//     });
// };

// const getProfileImageUrl = (filename) =>
//     filename ? `/uploads/students/${filename}` : null;

// // =====================================================
// // CREATE STUDENT
// // =====================================================
// const addStudent = async (req, res) => {
//     let connection;
//     let transactionStarted = false;

//     try {
//         const {
//             registrationNo,
//             firstName,
//             lastName,
//             email,
//             phoneNumber,
//             password
//         } = req.body;

//         const errors = validateStudentInput({
//             registrationNo,
//             firstName,
//             lastName,
//             email,
//             phoneNumber,
//             password
//         });

//         if (Object.keys(errors).length) {
//             removeUploadedFile(req.file);

//             return res.status(400).json({
//                 success: false,
//                 message: "Please correct the student details.",
//                 errors
//             });
//         }

//         const registration = registrationNo.trim();
//         const first = firstName.trim();
//         const last = lastName.trim();
//         const cleanEmail = email.trim();
//         const phone = phoneNumber.trim();

//         connection = await pool.getConnection();
//         await connection.beginTransaction();
//         transactionStarted = true;

//         const [duplicateUsername] = await connection.execute(
//             "SELECT user_id FROM users WHERE username = ? LIMIT 1",
//             [registration]
//         );

//         if (duplicateUsername.length) {
//             await connection.rollback();
//             transactionStarted = false;
//             removeUploadedFile(req.file);

//             return res.status(409).json({
//                 success: false,
//                 message: "Registration number is already registered."
//             });
//         }

//         const [duplicateRegistration] = await connection.execute(
//             "SELECT student_id FROM students WHERE registration_no = ? LIMIT 1",
//             [registration]
//         );

//         if (duplicateRegistration.length) {
//             await connection.rollback();
//             transactionStarted = false;
//             removeUploadedFile(req.file);

//             return res.status(409).json({
//                 success: false,
//                 message: "Registration number is already registered."
//             });
//         }

//         const [duplicateEmail] = await connection.execute(
//             "SELECT student_id FROM students WHERE email = ? LIMIT 1",
//             [cleanEmail]
//         );

//         if (duplicateEmail.length) {
//             await connection.rollback();
//             transactionStarted = false;
//             removeUploadedFile(req.file);

//             return res.status(409).json({
//                 success: false,
//                 message: "Email address is already registered."
//             });
//         }

//         const passwordHash = await bcrypt.hash(password, 10);

//         const [userResult] = await connection.execute(
//             `INSERT INTO users (username, password_hash, role)
//              VALUES (?, ?, 'STUDENT')`,
//             [registration, passwordHash]
//         );

//         const studentId = await createStudent(
//             connection,
//             userResult.insertId,
//             registration,
//             first,
//             last,
//             cleanEmail,
//             phone
//         );

//         const imageUrl = getProfileImageUrl(req.file?.filename);

//         await connection.execute(
//             "UPDATE students SET profile_image = ? WHERE student_id = ?",
//             [imageUrl, studentId]
//         );

//         await connection.commit();
//         transactionStarted = false;

//         return res.status(201).json({
//             success: true,
//             message: "Student created successfully.",
//             student: {
//                 student_id: studentId,
//                 user_id: userResult.insertId,
//                 registration_no: registration,
//                 first_name: first,
//                 last_name: last,
//                 email: cleanEmail,
//                 phone_number: phone,
//                 profile_image: imageUrl
//             }
//         });
//     } catch (error) {
//         if (connection && transactionStarted) {
//             try {
//                 await connection.rollback();
//             } catch (rollbackError) {
//                 console.error("Create rollback error:", rollbackError);
//             }
//         }

//         removeUploadedFile(req.file);
//         console.error("Create student error:", error);

//         if (error.code === "ER_DUP_ENTRY") {
//             return res.status(409).json({
//                 success: false,
//                 message: "Registration number or email is already registered."
//             });
//         }

//         return res.status(500).json({
//             success: false,
//             message: "Failed to create student."
//         });
//     } finally {
//         if (connection) connection.release();
//     }
// };

// // =====================================================
// // GET ALL STUDENTS
// // =====================================================
// const getStudents = async (req, res) => {
//     try {
//         const students = await getAllStudents();

//         return res.status(200).json({
//             success: true,
//             count: students.length,
//             students
//         });
//     } catch (error) {
//         console.error("Get students error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Failed to retrieve students."
//         });
//     }
// };

// // =====================================================
// // GET ONE STUDENT
// // =====================================================
// const getStudent = async (req, res) => {
//     try {
//         const student = await getStudentById(req.params.id);

//         if (!student) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Student not found."
//             });
//         }

//         return res.status(200).json({ success: true, student });
//     } catch (error) {
//         console.error("Get student error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Failed to retrieve student."
//         });
//     }
// };

// // =====================================================
// // UPDATE STUDENT DETAILS AND OPTIONAL PROFILE IMAGE
// // PUT /api/students/:id
// // =====================================================
// const editStudent = async (req, res) => {
//     let connection;
//     let transactionStarted = false;
//     let committed = false;
//     let oldImagePath = null;

//     try {
//         const studentId = Number(req.params.id);

//         if (!Number.isInteger(studentId) || studentId <= 0) {
//             removeUploadedFile(req.file);

//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid student ID."
//             });
//         }

//         const {
//             registrationNo,
//             firstName,
//             lastName,
//             email,
//             phoneNumber
//         } = req.body;

//         const errors = validateStudentInput({
//             registrationNo,
//             firstName,
//             lastName,
//             email,
//             phoneNumber
//         }, true);

//         if (Object.keys(errors).length) {
//             removeUploadedFile(req.file);

//             return res.status(400).json({
//                 success: false,
//                 message: "Please correct the student details.",
//                 errors
//             });
//         }

//         const registration = registrationNo.trim();
//         const first = firstName.trim();
//         const last = lastName.trim();
//         const cleanEmail = email.trim();
//         const phone = phoneNumber.trim();

//         connection = await pool.getConnection();
//         await connection.beginTransaction();
//         transactionStarted = true;

//         const [currentRows] = await connection.execute(
//             `SELECT student_id, user_id, profile_image
//              FROM students
//              WHERE student_id = ?
//              LIMIT 1`,
//             [studentId]
//         );

//         if (!currentRows.length) {
//             await connection.rollback();
//             transactionStarted = false;
//             removeUploadedFile(req.file);

//             return res.status(404).json({
//                 success: false,
//                 message: "Student not found."
//             });
//         }

//         const currentStudent = currentRows[0];
//         oldImagePath = currentStudent.profile_image;

//         const [duplicateRegistration] = await connection.execute(
//             `SELECT student_id
//              FROM students
//              WHERE registration_no = ? AND student_id <> ?
//              LIMIT 1`,
//             [registration, studentId]
//         );

//         if (duplicateRegistration.length) {
//             await connection.rollback();
//             transactionStarted = false;
//             removeUploadedFile(req.file);

//             return res.status(409).json({
//                 success: false,
//                 message: "Registration number is already registered."
//             });
//         }

//         const [duplicateUsername] = await connection.execute(
//             `SELECT user_id
//              FROM users
//              WHERE username = ? AND user_id <> ?
//              LIMIT 1`,
//             [registration, currentStudent.user_id]
//         );

//         if (duplicateUsername.length) {
//             await connection.rollback();
//             transactionStarted = false;
//             removeUploadedFile(req.file);

//             return res.status(409).json({
//                 success: false,
//                 message: "Registration number is already registered."
//             });
//         }

//         const [duplicateEmail] = await connection.execute(
//             `SELECT student_id
//              FROM students
//              WHERE email = ? AND student_id <> ?
//              LIMIT 1`,
//             [cleanEmail, studentId]
//         );

//         if (duplicateEmail.length) {
//             await connection.rollback();
//             transactionStarted = false;
//             removeUploadedFile(req.file);

//             return res.status(409).json({
//                 success: false,
//                 message: "Email address is already registered."
//             });
//         }

//         // If no new image was uploaded, preserve the existing image path.
//         const newImagePath = req.file
//             ? getProfileImageUrl(req.file.filename)
//             : currentStudent.profile_image;

//         // Save details and image path together.
//         await connection.execute(
//             `UPDATE students
//              SET registration_no = ?,
//                  first_name = ?,
//                  last_name = ?,
//                  email = ?,
//                  phone_number = ?,
//                  profile_image = ?
//              WHERE student_id = ?`,
//             [
//                 registration,
//                 first,
//                 last,
//                 cleanEmail,
//                 phone,
//                 newImagePath,
//                 studentId
//             ]
//         );

//         // Keep the login username synchronized with the registration number.
//         await connection.execute(
//             "UPDATE users SET username = ? WHERE user_id = ?",
//             [registration, currentStudent.user_id]
//         );

//         await connection.commit();
//         transactionStarted = false;
//         committed = true;

//         // Delete old file only after the new path is safely committed.
//         if (req.file && oldImagePath && oldImagePath !== newImagePath) {
//             removeOldProfileImage(oldImagePath);
//         }

//         return res.status(200).json({
//             success: true,
//             message: "Student updated successfully.",
//             student: {
//                 student_id: studentId,
//                 user_id: currentStudent.user_id,
//                 registration_no: registration,
//                 first_name: first,
//                 last_name: last,
//                 email: cleanEmail,
//                 phone_number: phone,
//                 profile_image: newImagePath
//             }
//         });
//     } catch (error) {
//         if (connection && transactionStarted) {
//             try {
//                 await connection.rollback();
//             } catch (rollbackError) {
//                 console.error("Update rollback error:", rollbackError);
//             }
//         }

//         // Do not delete a file after a successful database commit.
//         if (!committed) {
//             removeUploadedFile(req.file);
//         }

//         console.error("Update student error:", error);

//         if (error.code === "ER_DUP_ENTRY") {
//             return res.status(409).json({
//                 success: false,
//                 message: "Registration number or email is already registered."
//             });
//         }

//         return res.status(500).json({
//             success: false,
//             message: "Failed to update student."
//         });
//     } finally {
//         if (connection) connection.release();
//     }
// };

// // =====================================================
// // DELETE STUDENT
// // =====================================================
// const removeStudent = async (req, res) => {
//     try {
//         const student = await getStudentById(req.params.id);

//         if (!student) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Student not found."
//             });
//         }

//         const result = await deleteStudent(req.params.id);

//         if (result.affectedRows > 0 && student.profile_image) {
//             removeOldProfileImage(student.profile_image);
//         }

//         return res.status(200).json({
//             success: true,
//             message: "Student deleted successfully.",
//             affectedRows: result.affectedRows
//         });
//     } catch (error) {
//         console.error("Delete student error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Failed to delete student."
//         });
//     }
// };

// // =====================================================
// // GET LOGGED-IN STUDENT PROFILE
// // =====================================================
// const getMyProfile = async (req, res) => {
//     try {
//         const userId = req.user?.userId ?? req.user?.user_id;

//         if (!userId) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Authentication required."
//             });
//         }

//         const student = await getStudentByUserId(userId);

//         if (!student) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Student profile not found."
//             });
//         }

//         return res.status(200).json({ success: true, student });
//     } catch (error) {
//         console.error("Get my profile error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Failed to retrieve profile."
//         });
//     }
// };

// module.exports = {
//     addStudent,
//     getStudents,
//     getStudent,
//     getMyProfile,
//     editStudent,
//     removeStudent
// };




const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

const {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    deleteStudent,
    updateStudentPassword
} = require("../models/studentModel");

const uploadDirectory = path.resolve(
    __dirname,
    "../../uploads/students"
);

// =====================================================
// VALIDATE STUDENT INPUT
// =====================================================
const validateStudentInput = (data, isEditing = false) => {
    const errors = {};

    const {
        registrationNo,
        firstName,
        lastName,
        email,
        phoneNumber,
        password
    } = data;

    if (
        typeof registrationNo !== "string" ||
        !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{5,20}$/.test(
            registrationNo.trim()
        )
    ) {
        errors.registrationNo =
            "Registration number must contain 5–20 letters and numbers, e.g. REG009.";
    }

    if (
        typeof firstName !== "string" ||
        !/^[A-Za-z]{3,}$/.test(firstName.trim())
    ) {
        errors.firstName =
            "First name must contain at least 3 English letters.";
    }

    if (
        typeof lastName !== "string" ||
        !/^[A-Za-z]{3,}$/.test(lastName.trim())
    ) {
        errors.lastName =
            "Last name must contain at least 3 English letters.";
    }

    if (
        typeof email !== "string" ||
        !/^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(email.trim())
    ) {
        errors.email =
            "Enter a valid Gmail address ending in @gmail.com.";
    }

    if (
        typeof phoneNumber !== "string" ||
        !/^\d{10}$/.test(phoneNumber.trim())
    ) {
        errors.phoneNumber =
            "Phone number must contain exactly 10 digits.";
    }

    if (!isEditing || password !== undefined) {
        if (typeof password !== "string" || password.length < 8) {
            errors.password =
                "Password must contain at least 8 characters.";
        } else if (!/[A-Z]/.test(password)) {
            errors.password =
                "Password must contain an uppercase letter.";
        } else if (!/[a-z]/.test(password)) {
            errors.password =
                "Password must contain a lowercase letter.";
        } else if (!/\d/.test(password)) {
            errors.password = "Password must contain a number.";
        } else if (!/[^A-Za-z0-9]/.test(password)) {
            errors.password =
                "Password must contain a special character.";
        }
    }

    return errors;
};

// =====================================================
// IMAGE HELPERS
// =====================================================
const removeUploadedFile = (file) => {
    if (!file?.path) return;

    fs.unlink(file.path, (error) => {
        if (error && error.code !== "ENOENT") {
            console.error("Failed to remove uploaded image:", error);
        }
    });
};

const removeOldProfileImage = (imageUrl) => {
    if (!imageUrl) return;

    const filename = path.basename(
        String(imageUrl).replace(/\\/g, "/")
    );

    if (!filename || filename === "." || filename === "..") return;

    const imagePath = path.resolve(uploadDirectory, filename);

    if (path.dirname(imagePath) !== uploadDirectory) return;

    fs.unlink(imagePath, (error) => {
        if (error && error.code !== "ENOENT") {
            console.error("Failed to remove old profile image:", error);
        }
    });
};

const getProfileImageUrl = (filename) =>
    filename ? `/uploads/students/${filename}` : null;

// =====================================================
// CREATE STUDENT
// POST /api/students
// =====================================================
const addStudent = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const {
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            password
        } = req.body;

        const errors = validateStudentInput({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber,
            password
        });

        if (Object.keys(errors).length) {
            removeUploadedFile(req.file);

            return res.status(400).json({
                success: false,
                message: "Please correct the student details.",
                errors
            });
        }

        const registration = registrationNo.trim();
        const first = firstName.trim();
        const last = lastName.trim();
        const cleanEmail = email.trim();
        const phone = phoneNumber.trim();

        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [duplicateUsername] = await connection.execute(
            "SELECT user_id FROM users WHERE username = ? LIMIT 1",
            [registration]
        );

        if (duplicateUsername.length) {
            await connection.rollback();
            transactionStarted = false;
            removeUploadedFile(req.file);

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered."
            });
        }

        const [duplicateRegistration] = await connection.execute(
            "SELECT student_id FROM students WHERE registration_no = ? LIMIT 1",
            [registration]
        );

        if (duplicateRegistration.length) {
            await connection.rollback();
            transactionStarted = false;
            removeUploadedFile(req.file);

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered."
            });
        }

        const [duplicateEmail] = await connection.execute(
            "SELECT student_id FROM students WHERE email = ? LIMIT 1",
            [cleanEmail]
        );

        if (duplicateEmail.length) {
            await connection.rollback();
            transactionStarted = false;
            removeUploadedFile(req.file);

            return res.status(409).json({
                success: false,
                message: "Email address is already registered."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [userResult] = await connection.execute(
            `INSERT INTO users (username, password_hash, role)
             VALUES (?, ?, 'STUDENT')`,
            [registration, passwordHash]
        );

        const studentId = await createStudent(
            connection,
            userResult.insertId,
            registration,
            first,
            last,
            cleanEmail,
            phone
        );

        const imageUrl = getProfileImageUrl(req.file?.filename);

        await connection.execute(
            "UPDATE students SET profile_image = ? WHERE student_id = ?",
            [imageUrl, studentId]
        );

        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            success: true,
            message: "Student created successfully.",
            student: {
                student_id: studentId,
                user_id: userResult.insertId,
                registration_no: registration,
                first_name: first,
                last_name: last,
                email: cleanEmail,
                phone_number: phone,
                profile_image: imageUrl
            }
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Create rollback error:", rollbackError);
            }
        }

        removeUploadedFile(req.file);
        console.error("Create student error:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Registration number or email is already registered."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create student."
        });
    } finally {
        if (connection) connection.release();
    }
};

// =====================================================
// GET ALL STUDENTS
// GET /api/students
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
            message: "Failed to retrieve students."
        });
    }
};

// =====================================================
// GET STUDENT BY ID
// GET /api/students/:id
// =====================================================
const getStudent = async (req, res) => {
    try {
        const student = await getStudentById(req.params.id);

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
        console.error("Get student error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve student."
        });
    }
};

// =====================================================
// UPDATE STUDENT DETAILS AND PROFILE IMAGE
// PUT /api/students/:id
// =====================================================
const editStudent = async (req, res) => {
    let connection;
    let transactionStarted = false;
    let committed = false;
    let oldImagePath = null;

    try {
        const studentId = Number(req.params.id);

        if (!Number.isInteger(studentId) || studentId <= 0) {
            removeUploadedFile(req.file);

            return res.status(400).json({
                success: false,
                message: "Invalid student ID."
            });
        }

        const {
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        } = req.body;

        const errors = validateStudentInput({
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        }, true);

        if (Object.keys(errors).length) {
            removeUploadedFile(req.file);

            return res.status(400).json({
                success: false,
                message: "Please correct the student details.",
                errors
            });
        }

        const registration = registrationNo.trim();
        const first = firstName.trim();
        const last = lastName.trim();
        const cleanEmail = email.trim();
        const phone = phoneNumber.trim();

        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [currentRows] = await connection.execute(
            `SELECT student_id, user_id, profile_image
             FROM students
             WHERE student_id = ?
             LIMIT 1`,
            [studentId]
        );

        if (!currentRows.length) {
            await connection.rollback();
            transactionStarted = false;
            removeUploadedFile(req.file);

            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        const currentStudent = currentRows[0];
        oldImagePath = currentStudent.profile_image;

        const [duplicateRegistration] = await connection.execute(
            `SELECT student_id
             FROM students
             WHERE registration_no = ? AND student_id <> ?
             LIMIT 1`,
            [registration, studentId]
        );

        if (duplicateRegistration.length) {
            await connection.rollback();
            transactionStarted = false;
            removeUploadedFile(req.file);

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered."
            });
        }

        const [duplicateUsername] = await connection.execute(
            `SELECT user_id
             FROM users
             WHERE username = ? AND user_id <> ?
             LIMIT 1`,
            [registration, currentStudent.user_id]
        );

        if (duplicateUsername.length) {
            await connection.rollback();
            transactionStarted = false;
            removeUploadedFile(req.file);

            return res.status(409).json({
                success: false,
                message: "Registration number is already registered."
            });
        }

        const [duplicateEmail] = await connection.execute(
            `SELECT student_id
             FROM students
             WHERE email = ? AND student_id <> ?
             LIMIT 1`,
            [cleanEmail, studentId]
        );

        if (duplicateEmail.length) {
            await connection.rollback();
            transactionStarted = false;
            removeUploadedFile(req.file);

            return res.status(409).json({
                success: false,
                message: "Email address is already registered."
            });
        }

        const newImagePath = req.file
            ? getProfileImageUrl(req.file.filename)
            : currentStudent.profile_image;

        await connection.execute(
            `UPDATE students
             SET registration_no = ?,
                 first_name = ?,
                 last_name = ?,
                 email = ?,
                 phone_number = ?,
                 profile_image = ?
             WHERE student_id = ?`,
            [
                registration,
                first,
                last,
                cleanEmail,
                phone,
                newImagePath,
                studentId
            ]
        );

        await connection.execute(
            "UPDATE users SET username = ? WHERE user_id = ?",
            [registration, currentStudent.user_id]
        );

        await connection.commit();
        transactionStarted = false;
        committed = true;

        if (req.file && oldImagePath && oldImagePath !== newImagePath) {
            removeOldProfileImage(oldImagePath);
        }

        return res.status(200).json({
            success: true,
            message: "Student updated successfully.",
            student: {
                student_id: studentId,
                user_id: currentStudent.user_id,
                registration_no: registration,
                first_name: first,
                last_name: last,
                email: cleanEmail,
                phone_number: phone,
                profile_image: newImagePath
            }
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Update rollback error:", rollbackError);
            }
        }

        if (!committed) {
            removeUploadedFile(req.file);
        }

        console.error("Update student error:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Registration number or email is already registered."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update student."
        });
    } finally {
        if (connection) connection.release();
    }
};

// =====================================================
// DELETE STUDENT
// DELETE /api/students/:id
// =====================================================
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

        if (result.affectedRows > 0 && student.profile_image) {
            removeOldProfileImage(student.profile_image);
        }

        return res.status(200).json({
            success: true,
            message: "Student deleted successfully.",
            affectedRows: result.affectedRows
        });
    } catch (error) {
        console.error("Delete student error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to delete student."
        });
    }
};

// =====================================================
// GET LOGGED-IN STUDENT PROFILE
// GET /api/students/me
// =====================================================
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const student = await getStudentByUserId(userId);

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
        console.error("Get my profile error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve profile."
        });
    }
};

// =====================================================
// CHANGE LOGGED-IN STUDENT PASSWORD
// PATCH /api/students/me/password
// =====================================================
const changeMyPassword = async (req, res) => {
    try {
        const userId = req.user?.userId ?? req.user?.user_id;
        const role = String(req.user?.role || "").toLowerCase();

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login again."
            });
        }

        if (role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can change their password."
            });
        }

        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body || {};

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string" ||
            typeof confirmPassword !== "string" ||
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all password fields."
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirmation do not match."
            });
        }

        const strongPassword =
            newPassword.length >= 8 &&
            /[a-z]/.test(newPassword) &&
            /[A-Z]/.test(newPassword) &&
            /\d/.test(newPassword) &&
            /[^A-Za-z0-9]/.test(newPassword);

        if (!strongPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 8 characters, uppercase, lowercase, a number and a special character."
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must differ from the current password."
            });
        }

        const [users] = await pool.execute(
            `SELECT password_hash
             FROM users
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        if (!users.length) {
            return res.status(404).json({
                success: false,
                message: "Student account not found."
            });
        }

        const matches = await bcrypt.compare(
            currentPassword,
            users[0].password_hash
        );

        if (!matches) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        const updated = await updateStudentPassword(
            userId,
            passwordHash
        );

        if (!updated) {
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
            message: "An error occurred while changing the password."
        });
    }
};

module.exports = {
    addStudent,
    getStudents,
    getStudent,
    getMyProfile,
    editStudent,
    removeStudent,
    changeMyPassword
};
