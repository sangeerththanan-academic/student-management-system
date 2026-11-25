// CR06 - Course controller (create + list)
// ASSUMPTION: ../config/db exports a mysql2 pool. Change the path/name if yours differs.
const dbModule = require('../config/db');
const db = typeof dbModule.promise === 'function' ? dbModule.promise() : dbModule;

const validateCourse = ({ course_code, course_name, description, credits }) => {
  const errors = {};
  if (!course_code || !String(course_code).trim()) errors.course_code = 'Course code is required';
  else if (String(course_code).trim().length > 20) errors.course_code = 'Course code must be 20 characters or less';

  if (!course_name || !String(course_name).trim()) errors.course_name = 'Course name is required';
  else if (String(course_name).trim().length > 150) errors.course_name = 'Course name must be 150 characters or less';

  if (description && String(description).length > 1000) errors.description = 'Description must be 1000 characters or less';

  const c = Number(credits);
  if (credits === undefined || credits === null || credits === '') errors.credits = 'Credits is required';
  else if (!Number.isInteger(c) || c < 1 || c > 10) errors.credits = 'Credits must be a whole number between 1 and 10';

  return errors;
};

// POST /api/courses
exports.createCourse = async (req, res) => {
  try {
    const errors = validateCourse(req.body || {});
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    const { course_code, course_name, description, credits } = req.body;
    const [result] = await db.query(
      'INSERT INTO courses (course_code, course_name, description, credits) VALUES (?, ?, ?, ?)',
      [String(course_code).trim().toUpperCase(), String(course_name).trim(), description ? String(description).trim() : null, Number(credits)]
    );
    const [rows] = await db.query('SELECT * FROM courses WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Course code already exists', errors: { course_code: 'Course code already exists' } });
    }
    console.error('createCourse error:', err);
    return res.status(500).json({ message: 'Server error while creating course' });
  }
};

// GET /api/courses
exports.getCourses = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM courses ORDER BY created_at DESC, id DESC');
    return res.json(rows);
  } catch (err) {
    console.error('getCourses error:', err);
    return res.status(500).json({ message: 'Server error while fetching courses' });
  }
};
