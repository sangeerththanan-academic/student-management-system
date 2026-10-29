const bcrypt = require("bcrypt");
const pool = require("../config/db");

const normalizeStudentValue = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePhoneNumber = (phoneNumber) =>
  /^\d{10}$/.test(phoneNumber);

const validateStudentData = (payload, isEdit = false) => {
  const errors = {};

  const registrationNo = normalizeStudentValue(
    payload.registrationNo || payload.registration_no
  );
  const firstName = normalizeStudentValue(
    payload.firstName || payload.first_name
  );
  const lastName = normalizeStudentValue(
    payload.lastName || payload.last_name
  );
  const email = normalizeStudentValue(payload.email);
  const phoneNumber = normalizeStudentValue(
    payload.phoneNumber || payload.phone_number
  );
  const password = normalizeStudentValue(payload.password);

  if (!registrationNo) errors.registrationNo = "Registration number is required.";
  if (!firstName) errors.firstName = "First name is required.";
  if (!lastName) errors.lastName = "Last name is required.";

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

  return {
    isValid: Object.keys(errors).length === 0,
    firstError: Object.values(errors)[0] || null,
    errors,
  };
};

const findDuplicateEmail = async (
  email,
  excludeUserId = null,
  executor = pool
) => {
  let sql = "SELECT student_id FROM students WHERE email = ?";
  const params = [email];

  if (excludeUserId !== null && excludeUserId !== undefined) {
    sql += " AND user_id <> ?";
    params.push(excludeUserId);
  }

  sql += " LIMIT 1";

  const [rows] = await executor.execute(sql, params);
  return rows.length > 0;
};

const getStudentByUserId = async (userId, executor = pool) => {
  const [rows] = await executor.execute(
    `SELECT student_id, user_id, registration_no, first_name, last_name,
            email, phone_number, profile_photo
     FROM students
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
};

// Add student
const addStudent = async (req, res) => {
  let connection;

  try {
    const validation = validateStudentData(req.body, false);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.firstError,
        errors: validation.errors,
      });
    }

    const registrationNo = normalizeStudentValue(
      req.body.registrationNo || req.body.registration_no
    );
    const firstName = normalizeStudentValue(
      req.body.firstName || req.body.first_name
    );
    const lastName = normalizeStudentValue(
      req.body.lastName || req.body.last_name
    );
    const email = normalizeStudentValue(req.body.email).toLowerCase();
    const phoneNumber = normalizeStudentValue(
      req.body.phoneNumber || req.body.phone_number
    );
    const password = normalizeStudentValue(req.body.password);
    const profilePhoto =
      req.body.profilePhoto || req.body.profile_photo || null;

    const [existingRegistration] = await pool.execute(
      "SELECT student_id FROM students WHERE registration_no = ? LIMIT 1",
      [registrationNo]
    );

    if (existingRegistration.length) {
      return res.status(409).json({
        success: false,
        message: "Registration number already exists.",
      });
    }

    if (await findDuplicateEmail(email)) {
      return res.status(409).json({
        success: false,
        message: "Email address already exists.",
      });
    }

    const [existingUser] = await pool.execute(
      "SELECT user_id FROM users WHERE username = ? LIMIT 1",
      [email]
    );

    if (existingUser.length) {
      return res.status(409).json({
        success: false,
        message: "Email address is already registered as a username.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [userResult] = await connection.execute(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'STUDENT')",
      [email, passwordHash]
    );

    const userId = userResult.insertId;

    const [studentResult] = await connection.execute(
      `INSERT INTO students
       (user_id, registration_no, first_name, last_name, email, phone_number, profile_photo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        registrationNo,
        firstName,
        lastName,
        email,
        phoneNumber,
        profilePhoto,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Student created successfully.",
      student: {
        student_id: studentResult.insertId,
        user_id: userId,
        registration_no: registrationNo,
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phoneNumber,
        profile_photo: profilePhoto,
      },
    });
  } catch (error) {
    if (connection) await connection.rollback();

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
  } finally {
    if (connection) connection.release();
  }
};

// Get all students
const getAllStudents = async (req, res) => {
  try {
    const [students] = await pool.execute(
      `SELECT student_id, user_id, registration_no, first_name, last_name,
              email, phone_number, profile_photo
       FROM students
       ORDER BY student_id DESC`
    );

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

// Get student by ID
const getStudentById = async (req, res) => {
  try {
    const [students] = await pool.execute(
      `SELECT student_id, user_id, registration_no, first_name, last_name,
              email, phone_number, profile_photo
       FROM students
       WHERE student_id = ?
       LIMIT 1`,
      [req.params.id]
    );

    if (!students.length) {
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

// Get logged-in student's profile
const getMyProfile = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.userId);

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

// CR-019: Update logged-in student's profile
const updateMyProfile = async (req, res) => {
  let connection;

  try {
    const userId = req.user.userId;
    const email = normalizeStudentValue(req.body.email).toLowerCase();
    const phoneNumber = normalizeStudentValue(
      req.body.phoneNumber || req.body.phone_number
    );

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

    const existingStudent = await getStudentByUserId(userId);

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    if (await findDuplicateEmail(email, userId)) {
      return res.status(409).json({
        success: false,
        message: "This email address is already used by another student.",
      });
    }

    const [duplicateUsername] = await pool.execute(
      "SELECT user_id FROM users WHERE username = ? AND user_id <> ? LIMIT 1",
      [email, userId]
    );

    if (duplicateUsername.length) {
      return res.status(409).json({
        success: false,
        message: "This email address is already used by another account.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      "UPDATE students SET email = ?, phone_number = ? WHERE user_id = ?",
      [email, phoneNumber, userId]
    );

    // The users table uses username, not email.
    await connection.execute(
      "UPDATE users SET username = ? WHERE user_id = ?",
      [email, userId]
    );

    await connection.commit();

    const updatedStudent = await getStudentByUserId(userId);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      student: updatedStudent,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Profile update rollback error:", rollbackError);
      }
    }

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
  } finally {
    if (connection) connection.release();
  }
};

// Admin: edit student
const editStudent = async (req, res) => {
  let connection;

  try {
    const studentId = req.params.id;
    const validation = validateStudentData(req.body, true);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.firstError,
        errors: validation.errors,
      });
    }

    const registrationNo = normalizeStudentValue(
      req.body.registrationNo || req.body.registration_no
    );
    const firstName = normalizeStudentValue(
      req.body.firstName || req.body.first_name
    );
    const lastName = normalizeStudentValue(
      req.body.lastName || req.body.last_name
    );
    const email = normalizeStudentValue(req.body.email).toLowerCase();
    const phoneNumber = normalizeStudentValue(
      req.body.phoneNumber || req.body.phone_number
    );
    const password = normalizeStudentValue(req.body.password);
    const profilePhoto =
      req.body.profilePhoto || req.body.profile_photo || null;

    const [found] = await pool.execute(
      "SELECT student_id, user_id FROM students WHERE student_id = ? LIMIT 1",
      [studentId]
    );

    if (!found.length) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const userId = found[0].user_id;

    const [duplicateRegistration] = await pool.execute(
      "SELECT student_id FROM students WHERE registration_no = ? AND student_id <> ? LIMIT 1",
      [registrationNo, studentId]
    );

    if (duplicateRegistration.length) {
      return res.status(409).json({
        success: false,
        message: "Registration number already exists.",
      });
    }

    if (await findDuplicateEmail(email, userId)) {
      return res.status(409).json({
        success: false,
        message: "Email address already exists.",
      });
    }

    const [duplicateUsername] = await pool.execute(
      "SELECT user_id FROM users WHERE username = ? AND user_id <> ? LIMIT 1",
      [email, userId]
    );

    if (duplicateUsername.length) {
      return res.status(409).json({
        success: false,
        message: "Email address is already registered.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE students
       SET registration_no = ?, first_name = ?, last_name = ?, email = ?,
           phone_number = ?, profile_photo = ?
       WHERE student_id = ?`,
      [
        registrationNo,
        firstName,
        lastName,
        email,
        phoneNumber,
        profilePhoto,
        studentId,
      ]
    );

    await connection.execute(
      "UPDATE users SET username = ? WHERE user_id = ?",
      [email, userId]
    );

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);

      await connection.execute(
        "UPDATE users SET password_hash = ? WHERE user_id = ?",
        [passwordHash, userId]
      );
    }

    await connection.commit();

    const student = await getStudentByUserId(userId);

    return res.status(200).json({
      success: true,
      message: "Student updated successfully.",
      student,
    });
  } catch (error) {
    if (connection) await connection.rollback();

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
  } finally {
    if (connection) connection.release();
  }
};

// Admin: delete student
const deleteStudent = async (req, res) => {
  let connection;

  try {
    const [students] = await pool.execute(
      "SELECT student_id, user_id FROM students WHERE student_id = ? LIMIT 1",
      [req.params.id]
    );

    if (!students.length) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      "DELETE FROM students WHERE student_id = ?",
      [req.params.id]
    );

    await connection.execute(
      "DELETE FROM users WHERE user_id = ?",
      [students[0].user_id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Student deleted successfully.",
    });
  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Delete student error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete student.",
    });
  } finally {
    if (connection) connection.release();
  }
};

// Change logged-in student's password
const changeStudentPassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const currentPassword = normalizeStudentValue(req.body.currentPassword);
    const newPassword = normalizeStudentValue(req.body.newPassword);
    const confirmPassword = normalizeStudentValue(req.body.confirmPassword);

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

    const [users] = await pool.execute(
      "SELECT password_hash FROM users WHERE user_id = ? LIMIT 1",
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const valid = await bcrypt.compare(
      currentPassword,
      users[0].password_hash
    );

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.execute(
      "UPDATE users SET password_hash = ? WHERE user_id = ?",
      [passwordHash, userId]
    );

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

// Import students
const importStudents = async (req, res) => {
  const students = req.body.students;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide a non-empty students array.",
    });
  }

  let connection;

  const results = {
    imported: 0,
    failed: 0,
    errors: [],
  };

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (let index = 0; index < students.length; index += 1) {
      const item = students[index];

      const registrationNo = normalizeStudentValue(
        item.registrationNo || item.registration_no
      );
      const firstName = normalizeStudentValue(
        item.firstName || item.first_name
      );
      const lastName = normalizeStudentValue(
        item.lastName || item.last_name
      );
      const email = normalizeStudentValue(item.email).toLowerCase();
      const phoneNumber = normalizeStudentValue(
        item.phoneNumber || item.phone_number
      );
      const password = normalizeStudentValue(item.password);

      const validation = validateStudentData(
        {
          registrationNo,
          firstName,
          lastName,
          email,
          phoneNumber,
          password,
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

      const [existingEmail] = await connection.execute(
        "SELECT student_id FROM students WHERE email = ? LIMIT 1",
        [email]
      );

      const [existingUsername] = await connection.execute(
        "SELECT user_id FROM users WHERE username = ? LIMIT 1",
        [email]
      );

      if (
        existingRegistration.length ||
        existingEmail.length ||
        existingUsername.length
      ) {
        results.failed += 1;
        results.errors.push({
          row: index + 1,
          registrationNo,
          message: "Registration number or email already exists.",
        });
        continue;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const [userResult] = await connection.execute(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'STUDENT')",
        [email, passwordHash]
      );

      await connection.execute(
        `INSERT INTO students
         (user_id, registration_no, first_name, last_name, email, phone_number, profile_photo)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userResult.insertId,
          registrationNo,
          firstName,
          lastName,
          email,
          phoneNumber,
          item.profilePhoto || item.profile_photo || null,
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
    if (connection) await connection.rollback();

    console.error("Import students error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to import students.",
      results,
    });
  } finally {
    if (connection) connection.release();
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