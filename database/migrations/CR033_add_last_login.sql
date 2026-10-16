
-- ============================================================
-- CR033: Last Login Tracking and Display for Student Accounts
-- Database migration for existing installations
-- ============================================================

USE student_management;

ALTER TABLE users
    ADD COLUMN last_login DATETIME NULL DEFAULT NULL
    AFTER role;

-- ============================================================
-- CR033 MIGRATION COMPLETE
-- ============================================================
