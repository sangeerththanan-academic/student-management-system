-- ============================================================
-- Student Management System
-- Database Seed Data - Version 2.0
-- Organization: ABC Institute
-- Database: MySQL
--
-- Development/Test Data
-- ============================================================


USE student_management;


-- ============================================================
-- 1. USERS
-- ============================================================
--
-- Test password for all sample users:
--
-- Password123!
--
-- These bcrypt hashes are for development/testing only.
-- ============================================================

INSERT INTO users (
    username,
    email,
    password_hash,
    role
)
VALUES
(
    'admin',
    'admin@example.com',
    '$2b$10$RmFfhU3ibXGS.CjEFgA.OeDe3ba06x7K4Mx0PF8SArlhYO6Tvihiq',
    'ADMIN'
),
(
    'REG001',
    'john@example.com',
    '$2b$10$RmFfhU3ibXGS.CjEFgA.OeDe3ba06x7K4Mx0PF8SArlhYO6Tvihiq',
    'STUDENT'
),
(
    'REG002',
    'sarah@example.com',
    '$2b$10$RmFfhU3ibXGS.CjEFgA.OeDe3ba06x7K4Mx0PF8SArlhYO6Tvihiq',
    'STUDENT'
);


-- ============================================================
-- 2. STUDENTS
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
-- 3. VERIFICATION - USERS
-- ============================================================

SELECT
    user_id,
    username,
    email,
    role,
    created_at,
    updated_at
FROM users;


-- ============================================================
-- 4. VERIFICATION - STUDENTS
-- ============================================================

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


-- ============================================================
-- 5. VERIFICATION - USERS + STUDENTS
-- ============================================================

SELECT
    u.user_id,
    u.username,
    u.email AS account_email,
    u.role,
    s.student_id,
    s.registration_no,
    s.first_name,
    s.last_name,
    s.email AS student_email,
    s.phone_number

FROM users u

LEFT JOIN students s
    ON u.user_id = s.user_id;


-- ============================================================
-- 6. VERIFY PASSWORD RESET TABLE
-- ============================================================

SELECT
    id,
    user_id,
    token_hash,
    expires_at,
    used_at,
    created_at
FROM password_reset_tokens;


-- ============================================================
-- DATABASE SEED DATA - VERSION 2.0 COMPLETE
-- ============================================================
