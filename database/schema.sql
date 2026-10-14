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
-- ============================================================


-- ============================================================
-- 1. DATABASE
-- ============================================================

DROP DATABASE IF EXISTS student_management;

CREATE DATABASE student_management;

USE student_management;


-- ============================================================
-- 2. USERS TABLE
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

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    last_login DATETIME NULL DEFAULT NULL
);


-- ============================================================
-- 3. STUDENTS TABLE
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
-- DATABASE SCHEMA - VERSION 1.0 COMPLETE
-- ============================================================