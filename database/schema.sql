-- ============================================================
-- Student Management System
-- Database Schema - Version 1.0
-- Organization: ABC Institute
-- Database: MySQL
-- ============================================================

-- ============================================================
-- DATABASE
-- ============================================================

CREATE DATABASE IF NOT EXISTS student_management;

USE student_management;


-- ============================================================
-- 1. USERS TABLE
-- Stores authentication and role information
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(100) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM('ADMIN', 'STUDENT') NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- CR033: Tracks the most recent successful student login
    last_login DATETIME NULL DEFAULT NULL
);


-- ============================================================
-- 2. STUDENTS TABLE
-- Stores basic student information
-- ============================================================

CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL UNIQUE,

    registration_no VARCHAR(50) NOT NULL UNIQUE,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    phone_number VARCHAR(20) NOT NULL,

    -- CR-010: Stores profile image file path (e.g., /uploads/students/student_xxx.jpg)
    profile_photo VARCHAR(255) NULL DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ============================================================
-- 3. COURSES TABLE (CR-009)
-- Stores available courses for student enrollment
-- ============================================================

CREATE TABLE IF NOT EXISTS courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,

    course_code VARCHAR(50) NOT NULL UNIQUE,

    title VARCHAR(150) NOT NULL,

    description TEXT NULL,

    category VARCHAR(100) NOT NULL,

    level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',

    duration VARCHAR(50) NOT NULL,

    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    status ENUM('AVAILABLE', 'UPCOMING', 'CLOSED') NOT NULL DEFAULT 'AVAILABLE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 4. ENROLLMENTS TABLE (CR-009)
-- Stores student course enrollment records
-- ============================================================

CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    course_id INT NOT NULL,

    enrollment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status ENUM('ENROLLED', 'COMPLETED', 'DROPPED') NOT NULL DEFAULT 'ENROLLED',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_enrollment_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_enrollment_course
        FOREIGN KEY (course_id)
        REFERENCES courses(course_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT uq_student_course
        UNIQUE (student_id, course_id)
);


-- ============================================================
-- CR033 MIGRATION (run on existing databases)
-- ============================================================

-- ALTER TABLE users ADD COLUMN last_login DATETIME NULL DEFAULT NULL;


-- ============================================================
-- CR-010 MIGRATION (run on existing databases)
-- ============================================================

-- ALTER TABLE students ADD COLUMN profile_photo VARCHAR(255) NULL DEFAULT NULL;


-- ============================================================
-- CR-009 MIGRATION (run on existing databases)
-- ============================================================

-- CREATE TABLE IF NOT EXISTS courses (
--     course_id INT AUTO_INCREMENT PRIMARY KEY,
--     course_code VARCHAR(50) NOT NULL UNIQUE,
--     title VARCHAR(150) NOT NULL,
--     description TEXT NULL,
--     category VARCHAR(100) NOT NULL,
--     level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
--     duration VARCHAR(50) NOT NULL,
--     price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
--     status ENUM('AVAILABLE', 'UPCOMING', 'CLOSED') NOT NULL DEFAULT 'AVAILABLE',
--     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- );

-- CREATE TABLE IF NOT EXISTS enrollments (
--     enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
--     student_id INT NOT NULL,
--     course_id INT NOT NULL,
--     enrollment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     status ENUM('ENROLLED', 'COMPLETED', 'DROPPED') NOT NULL DEFAULT 'ENROLLED',
--     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON UPDATE CASCADE ON DELETE CASCADE,
--     CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) REFERENCES courses(course_id) ON UPDATE CASCADE ON DELETE CASCADE,
--     CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
-- );


-- ============================================================
-- DATABASE SCHEMA - VERSION 1.3 COMPLETE (CR-009)
-- ============================================================


