
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const {
  getStudentByUserId,
  updateMyProfileByUserId,
} = require("../models/studentModel");

const {
  getPasswordHashByUserId,
  updatePasswordHash,
} = require("../models/userModel");

// Normalize input values
const normalizeStudentValue = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

// Validate email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
const validatePhoneNumber = (phoneNumber) => {
  return /^\d{10}$/.test(phoneNumber);
};

// Validate student data for create/update operations
const validateStudentData = (payload, isEdit = false) => {
  const errors = {};

  const registrationNo = normalizeStudentValue(payload.registrationNo);
  const firstName = normalizeStudentValue(payload.firstName);
  const lastName = normalizeStudentValue(payload.lastName);
  const email = normalizeStudentValue(payload.email);
  const phoneNumber = normalizeStudentValue(payload.phoneNumber);
  const password = normalizeStudentValue(payload.password);

  if (!isEdit && !registrationNo) {
    errors.registrationNo = "Registration number is required.";
  }

  if (!firstName) {
    errors.firstName = "First name is required.";
  }

  if (!lastName) {
    errors.lastName = "Last name is required.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!validateEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!phoneNumber) {
    errors.phoneNumber = "Phone number is required.";
  } else if (!validatePhoneNumber(phoneNumber)) {
    errors.phoneNumber = "Phone number must contain exactly 10 digits.";
  }

  if (!isEdit && !password) {
    errors.password = "Password is required.";
  }

  const firstError = Object.values(errors)[0] || null;

  return {
    isValid: Object.keys(errors).length === 0,
    firstError,
    errors,
  };
};

// Check whether an email is already used by another student
const findDuplicateEmail = async (email, excludeUserId = null) => {
  let query = `
    SELECT student_id
    FROM students
    WHERE email = ?
  `;

  const params = [email];

  if (excludeUserId !== null && excludeUserId !== undefined) {
    query += " AND user_id <> ?";
    params.push(excludeUserId);
  }

  query += " LIMIT 1";

  const [rows] = await pool.execute(query, params);

  return rows.length > 0;
};

// Add a new student
const addStudent = async (req, res) => {
  try {
    const {
      registrationNo,
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      profilePhoto,
    } = req.body;

    const validation = validateStudentData(req.body, false);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.firstError,
        errors: validation.errors,
      });
    }

    const normalizedRegistrationNo =
      normalizeStudentValue(registrationNo);
    const normalizedFirstName = normalizeStudentValue(firstName);
    const normalizedLastName = normalizeStudentValue(lastName);
    const normalizedEmail = normalizeStudentValue(email);
    const normalizedPhoneNumber = normalizeStudentValue(phoneNumber);
    const normalizedPassword = normalizeStudentValue(password);

    const [existingRegistration] = await pool.execute(
      "SELECT student_id FROM students WHERE registration_no = ? LIMIT 1",
      [normalizedRegistrationNo]
    );

    if (existingRegistration.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Registration number already exists.",
      });
    }

    const emailExists = await findDuplicateEmail(normalizedEmail);

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email address already exists.",
      });
    }

    const [existingUser] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email address is already registered.",
      });
    }

    const passwordHash = await bcrypt.hash(normalizedPassword, 10);

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [userResult] = await connection.execute(
        `
          INSERT INTO users (name, email, password, role)
          VALUES (?, ?, ?, 'student')
        `,
        [
          `${normalizedFirstName} ${normalizedLastName}`,
          normalizedEmail,
          passwordHash,
        ]
      );

      const userId = userResult.insertId;

      const [studentResult] = await connection.execute(
        `
          INSERT INTO students
            (
              user_id,
              registration_no,
              first_name,
              last_name,
              email,
              phone_number,
              profile_photo
            )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          userId,
          normalizedRegistrationNo,
          normalizedFirstName,
          normalizedLastName,
          normalizedEmail,
          normalizedPhoneNumber,
          profilePhoto || null,
        ]
      );

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: "Student created successfully.",
        student: {
          student_id: studentResult.insertId,
          user_id: userId,
          registration_no: normalizedRegistrationNo,
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          email: normalizedEmail,
          phone_number: normalizedPhoneNumber,
          profile_photo: profilePhoto || null,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Add student error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A student with the provided details already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create student.",
    });
  }
};

// Get all students
const getAllStudents = async (req, res) => {
  try {
    const [students] = await pool.execute(`
      SELECT
        student_id,
        user_id,
        registration_no,
        first_name,
        last_name,
        email,
        phone_number,
        profile_photo
      FROM students
      ORDER BY student_id DESC
    `);

    return res.status(200).json({
      success: true,
      students,
    });
  } catch (error) {
    console.error("Get all students error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve students.",
    });
  }
};

// Get a student by student ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [students] = await pool.execute(
      `
        SELECT
          student_id,
          user_id,
          registration_no,
          first_name,
          last_name,
          email,
          phone_number,
          profile_photo
        FROM students
        WHERE student_id = ?
        LIMIT 1
      `,
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    return res.status(200).json({
      success: true,
      student: students[0],
    });
  } catch (error) {
    console.error("Get student by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve student.",
    });
  }
};

// Get the authenticated student's own profile
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const student = await getStudentByUserId(userId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Get my profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve your profile.",
    });
  }
};

// CR-019: Update the authenticated student's own profile
// Students can update ONLY their email and phone number.
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const email = normalizeStudentValue(req.body.email);
    const phoneNumber = normalizeStudentValue(req.body.phoneNumber);

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Validate phone number
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must contain exactly 10 digits.",
      });
    }

    // Make sure this authenticated user has a student profile
    const existingStudent = await getStudentByUserId(userId);

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    // Prevent using another student's email address
    const emailExists = await findDuplicateEmail(email, userId);

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "This email address is already used by another student.",
      });
    }

    // Update only email and phone number for the authenticated user
    await updateMyProfileByUserId(userId, email, phoneNumber);

    // Synchronize the email in the users table if the schema uses users.email
        await pool.execute(
    "UPDATE users SET email = ? WHERE user_id = ?",
    [email, userId]
    );

    // Return the latest profile data
    const updatedStudent = await getStudentByUserId(userId);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Update my profile error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This email address is already in use.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update your profile.",
    });
  }
};

// Edit a student by student ID (existing admin functionality)
const editStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      registrationNo,
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      profilePhoto,
    } = req.body;

    const validation = validateStudentData(req.body, true);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.firstError,
        errors: validation.errors,
      });
    }

    const normalizedRegistrationNo =
      normalizeStudentValue(registrationNo);
    const normalizedFirstName = normalizeStudentValue(firstName);
    const normalizedLastName = normalizeStudentValue(lastName);
    const normalizedEmail = normalizeStudentValue(email);
    const normalizedPhoneNumber = normalizeStudentValue(phoneNumber);

    const [existingStudents] = await pool.execute(
      "SELECT student_id, user_id FROM students WHERE student_id = ? LIMIT 1",
      [id]
    );

    if (existingStudents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const existingStudent = existingStudents[0];

    const [duplicateRegistration] = await pool.execute(
      `
        SELECT student_id
        FROM students
        WHERE registration_no = ?
          AND student_id <> ?
        LIMIT 1
      `,
      [normalizedRegistrationNo, id]
    );

    if (duplicateRegistration.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Registration number already exists.",
      });
    }

    const emailExists = await findDuplicateEmail(
      normalizedEmail,
      existingStudent.user_id
    );

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email address already exists.",
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(
        `
          UPDATE students
          SET
            registration_no = ?,
            first_name = ?,
            last_name = ?,
            email = ?,
            phone_number = ?,
            profile_photo = ?
          WHERE student_id = ?
        `,
        [
          normalizedRegistrationNo,
          normalizedFirstName,
          normalizedLastName,
          normalizedEmail,
          normalizedPhoneNumber,
          profilePhoto || null,
          id,
        ]
      );

      await connection.execute(
        `
          UPDATE users
          SET name = ?, email = ?
          WHERE id = ?
        `,
        [
          `${normalizedFirstName} ${normalizedLastName}`,
          normalizedEmail,
          existingStudent.user_id,
        ]
      );

      if (password && normalizeStudentValue(password)) {
        const passwordHash = await bcrypt.hash(
          normalizeStudentValue(password),
          10
        );

        await connection.execute(
          "UPDATE users SET password = ? WHERE id = ?",
          [passwordHash, existingStudent.user_id]
        );
      }

      await connection.commit();

      const [updatedRows] = await connection.execute(
        `
          SELECT
            student_id,
            user_id,
            registration_no,
            first_name,
            last_name,
            email,
            phone_number,
            profile_photo
          FROM students
          WHERE student_id = ?
          LIMIT 1
        `,
        [id]
      );

      return res.status(200).json({
        success: true,
        message: "Student updated successfully.",
        student: updatedRows[0],
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Edit student error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "The provided details already exist.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update student.",
    });
  }
};

// Delete a student
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const [students] = await pool.execute(
      "SELECT student_id, user_id FROM students WHERE student_id = ? LIMIT 1",
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const userId = students[0].user_id;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(
        "DELETE FROM students WHERE student_id = ?",
        [id]
      );

      await connection.execute(
        "DELETE FROM users WHERE id = ?",
        [userId]
      );

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: "Student deleted successfully.",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Delete student error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete student.",
    });
  }
};

// Change the authenticated student's password
const changeStudentPassword = async (req, res) => {
  try {
    const userId = req.user.userId;

    const currentPassword = normalizeStudentValue(
      req.body.currentPassword
    );
    const newPassword = normalizeStudentValue(req.body.newPassword);
    const confirmPassword = normalizeStudentValue(
      req.body.confirmPassword
    );

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password.",
      });
    }

    const passwordHash = await getPasswordHashByUserId(userId);

    if (!passwordHash) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await updatePasswordHash(userId, newPasswordHash);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change student password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change password.",
    });
  }
};

// Import students from CSV data
const importStudents = async (req, res) => {
  const students = req.body.students;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide a non-empty students array.",
    });
  }

  const connection = await pool.getConnection();

  const results = {
    imported: 0,
    failed: 0,
    errors: [],
  };

  try {
    await connection.beginTransaction();

    for (let index = 0; index < students.length; index += 1) {
      const student = students[index];

      const registrationNo = normalizeStudentValue(
        student.registrationNo || student.registration_no
      );
      const firstName = normalizeStudentValue(
        student.firstName || student.first_name
      );
      const lastName = normalizeStudentValue(
        student.lastName || student.last_name
      );
      const email = normalizeStudentValue(student.email);
      const phoneNumber = normalizeStudentValue(
        student.phoneNumber || student.phone_number
      );
      const password = normalizeStudentValue(student.password);

      const validation = validateStudentData(
        {
          registrationNo,
          firstName,
          lastName,
          email,
          phoneNumber,
          password: password || "TemporaryPassword123",
        },
        false
      );

      if (!validation.isValid) {
        results.failed += 1;
        results.errors.push({
          row: index + 1,
          registrationNo,
          message: validation.firstError,
        });
        continue;
      }

      const [existingRegistration] = await connection.execute(
        "SELECT student_id FROM students WHERE registration_no = ? LIMIT 1",
        [registrationNo]
      );

      if (existingRegistration.length > 0) {
        results.failed += 1;
        results.errors.push({
          row: index + 1,
          registrationNo,
          message: "Registration number already exists.",
        });
        continue;
      }

      const [existingEmail] = await connection.execute(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [email]
      );

      if (existingEmail.length > 0) {
        results.failed += 1;
        results.errors.push({
          row: index + 1,
          registrationNo,
          message: "Email address already exists.",
        });
        continue;
      }

      const passwordHash = await bcrypt.hash(
        password || "TemporaryPassword123",
        10
      );

      const [userResult] = await connection.execute(
        `
          INSERT INTO users (name, email, password, role)
          VALUES (?, ?, ?, 'student')
        `,
        [`${firstName} ${lastName}`, email, passwordHash]
      );

      await connection.execute(
        `
          INSERT INTO students
            (
              user_id,
              registration_no,
              first_name,
              last_name,
              email,
              phone_number,
              profile_photo
            )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          userResult.insertId,
          registrationNo,
          firstName,
          lastName,
          email,
          phoneNumber,
          student.profilePhoto || student.profile_photo || null,
        ]
      );

      results.imported += 1;
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Student import completed.",
      results,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Import students error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to import students.",
      results,
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  addStudent,
  getAllStudents,
  getStudentById,
  getMyProfile,
  updateMyProfile,
  editStudent,
  deleteStudent,
  changeStudentPassword,
  importStudents,
};
