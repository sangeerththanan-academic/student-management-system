-- ============================================================
-- Student Management System
-- Database Seed Data - Version 1.0
-- Organization: ABC Institute
-- Database: MySQL
-- ============================================================

USE student_management;


-- ============================================================
-- 1. USERS
-- ============================================================
-- password_hash values below are example bcrypt hashes.
-- These are development/test credentials only.
--
-- Test password for all sample users:
-- Password123!
-- ============================================================

INSERT INTO users (
    username,
    password_hash,
    role
)
VALUES
(
    'admin',
    '$2b$10$RmFfhU3ibXGS.CjEFgA.OeDe3ba06x7K4Mx0PF8SArlhYO6Tvihiq',
    'ADMIN'
),
(
    'REG001',
    '$2b$10$RmFfhU3ibXGS.CjEFgA.OeDe3ba06x7K4Mx0PF8SArlhYO6Tvihiq',
    'STUDENT'
),
(
    'REG002',
    '$2b$10$RmFfhU3ibXGS.CjEFgA.OeDe3ba06x7K4Mx0PF8SArlhYO6Tvihiq',
    'STUDENT'
);


-- ============================================================
-- 2. STUDENTS
-- ============================================================
-- Each student is linked to a STUDENT user account.
-- ============================================================

INSERT INTO students (
    user_id,
    registration_no,
    first_name,
    last_name,
    email,
    phone_number
)
VALUES
(
    2,
    'REG001',
    'John',
    'Perera',
    'john@example.com',
    '0712345678'
),
(
    3,
    'REG002',
    'Sarah',
    'Fernando',
    'sarah@example.com',
    '0723456789'
);


-- ============================================================
-- 3. COURSES (CR-009)
-- ============================================================

INSERT INTO courses (
    course_code,
    title,
    description,
    category,
    level,
    duration,
    price,
    status
)
VALUES
(
    'CS101',
    'Introduction to Computer Science',
    'Fundamental principles of computing, programming constructs, algorithms, and computational problem solving.',
    'Computer Science',
    'Beginner',
    '8 Weeks',
    150.00,
    'AVAILABLE'
),
(
    'WD201',
    'Full Stack Web Development',
    'Comprehensive modern web development covering React frontend, Node.js REST APIs, database integration, and deployment.',
    'Web Development',
    'Intermediate',
    '12 Weeks',
    250.00,
    'AVAILABLE'
),
(
    'DS301',
    'Data Science and Machine Learning',
    'Applied data analysis using Python, data visualization, statistical modelling, and practical machine learning algorithms.',
    'Data Science',
    'Advanced',
    '10 Weeks',
    300.00,
    'AVAILABLE'
),
(
    'MD202',
    'Mobile Application Development',
    'Cross-platform mobile app development with modern reactive frameworks, native device APIs, and UI/UX best practices.',
    'Mobile Development',
    'Intermediate',
    '8 Weeks',
    220.00,
    'AVAILABLE'
),
(
    'CY101',
    'Cybersecurity Fundamentals',
    'Core security concepts, network defense, threat analysis, cryptography principles, and secure software development.',
    'Cyber Security',
    'Beginner',
    '6 Weeks',
    180.00,
    'AVAILABLE'
),
(
    'CC201',
    'Cloud Computing Essentials',
    'Architecture and implementation of cloud-native systems, containerization, microservices, and serverless architectures.',
    'Cloud Computing',
    'Intermediate',
    '8 Weeks',
    200.00,
    'AVAILABLE'
);


-- ============================================================
-- 4. ENROLLMENTS (CR-009)
-- ============================================================

INSERT INTO enrollments (
    student_id,
    course_id,
    status
)
VALUES
(
    1,
    1,
    'ENROLLED'
);


-- ============================================================
-- 5. VERIFICATION QUERIES
-- ============================================================

-- View users
SELECT
    user_id,
    username,
    role,
    created_at,
    updated_at
FROM users;


-- View students
SELECT
    student_id,
    user_id,
    registration_no,
    first_name,
    last_name,
    email,
    phone_number,
    created_at,
    updated_at
FROM students;


-- View users with their student profiles
SELECT
    u.user_id,
    u.username,
    u.role,
    s.student_id,
    s.registration_no,
    s.first_name,
    s.last_name,
    s.email,
    s.phone_number
FROM users u
LEFT JOIN students s
    ON u.user_id = s.user_id;


-- View courses (CR-009)
SELECT
    course_id,
    course_code,
    title,
    category,
    level,
    duration,
    price,
    status
FROM courses;


-- View enrollments (CR-009)
SELECT
    e.enrollment_id,
    s.registration_no,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    c.course_code,
    c.title AS course_title,
    e.status,
    e.enrollment_date
FROM enrollments e
JOIN students s ON e.student_id = s.student_id
JOIN courses c ON e.course_id = c.course_id;


-- ============================================================
-- DATABASE SEED DATA - VERSION 1.1 COMPLETE (CR-009)
-- ============================================================

