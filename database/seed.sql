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
-- 3. VERIFICATION QUERIES
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


-- ============================================================
-- DATABASE SEED DATA - VERSION 1.0 COMPLETE
-- ============================================================
