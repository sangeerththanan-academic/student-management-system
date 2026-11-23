-- ============================================================
-- Student Management System
-- Database Schema - Version 2.0
-- Organization: ABC Institute
-- Database: MySQL
--
-- Includes:
--   - User authentication
--   - Role-based access
--   - Student management
--   - Password reset / Forgot Password
--   - Last login tracking (CR-033)
--   - Student profile photos (CR-010)
--   - Password reset OTPs (CR-026)
-- ============================================================


-- ============================================================
-- 1. DATABASE
-- ============================================================

DROP DATABASE IF EXISTS student_management;
CREATE DATABASE student_management;
USE student_management;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
-- Stores authentication and account information.
--
-- email is used for password recovery.
-- ============================================================

CREATE TABLE users (

    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'STUDENT') NOT NULL,
    last_login DATETIME NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. STUDENTS TABLE
-- ============================================================
-- Stores student profile information.
-- ============================================================

CREATE TABLE students (

    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    registration_no VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    profile_photo VARCHAR(255) NULL,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- ============================================================
-- 3. COURSES TABLE
-- ============================================================
-- Stores course records managed by administrators.
-- ============================================================

CREATE TABLE courses (

    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(50) NOT NULL UNIQUE,
    course_name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    credits TINYINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_course_credits
        CHECK (credits BETWEEN 1 AND 30)
);


-- ============================================================
-- 4. PASSWORD RESET OTPs TABLE
-- ============================================================
-- Stores hashed, temporary password-reset OTPs.
-- ============================================================

CREATE TABLE password_reset_otps (

    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    otp_hash CHAR(64) NOT NULL,

    expires_at DATETIME NOT NULL,

    attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,

    verified_at DATETIME NULL DEFAULT NULL,

    used_at DATETIME NULL DEFAULT NULL,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_reset_otp_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_password_reset_otp_user (user_id),

    INDEX idx_password_reset_otp_expiry (expires_at)
);


-- ============================================================
-- 5. PASSWORD RESET TOKENS TABLE
-- ============================================================
-- Stores hashed temporary password-reset tokens.
--
-- The actual reset token is never stored directly.
-- ============================================================

CREATE TABLE password_reset_tokens (

    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    token_hash VARCHAR(64) NOT NULL UNIQUE,

    expires_at DATETIME NOT NULL,

    used_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 6. INDEXES
-- ============================================================

CREATE INDEX idx_users_email
    ON users(email);

CREATE INDEX idx_students_user_id
    ON students(user_id);

CREATE INDEX idx_students_email
    ON students(email);

CREATE INDEX idx_password_reset_user
    ON password_reset_tokens(user_id);

CREATE INDEX idx_password_reset_expires
    ON password_reset_tokens(expires_at);

CREATE INDEX idx_password_reset_otps_user
    ON password_reset_otps(user_id);

CREATE INDEX idx_password_reset_otps_expires
    ON password_reset_otps(expires_at);


-- ============================================================
-- DATABASE SCHEMA - VERSION 2.0 COMPLETE
-- ============================================================
-- Includes CR-010 profile photos, CR-026 password reset OTPs,
-- and CR-033 last_login tracking.
-- ============================================================