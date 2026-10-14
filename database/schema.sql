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

    last_login DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP

);


-- ============================================================
-- 2. PASSWORD RESET TOKENS
-- Stores hashed, short-lived OTP and reset credentials
-- ============================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    reset_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    otp_hash CHAR(64) NOT NULL,

    attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,

    expires_at DATETIME NOT NULL,

    verified_at DATETIME NULL,

    reset_token_hash CHAR(64) NULL,

    reset_token_expires_at DATETIME NULL,

    used_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 3. STUDENTS TABLE
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
-- DATABASE SCHEMA - VERSION 1.1 COMPLETE
-- ============================================================
