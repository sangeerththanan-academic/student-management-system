-- CR026: Email OTP password recovery
-- BACK UP THE DATABASE BEFORE RUNNING THIS MIGRATION.
-- Run this migration once against the existing student_management database.

USE student_management;

-- Some installations already have users.email (including database/schema.sql).
-- Add it only on older installations that do not have the column yet.
SET @cr026_email_column_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'email'
);

SET @cr026_add_email_sql := IF(
    @cr026_email_column_exists = 0,
    'ALTER TABLE users ADD COLUMN email VARCHAR(150) NULL UNIQUE AFTER username',
    'SELECT 1'
);

PREPARE cr026_add_email_stmt FROM @cr026_add_email_sql;
EXECUTE cr026_add_email_stmt;
DEALLOCATE PREPARE cr026_add_email_stmt;

-- Copy the existing student email addresses to their linked user accounts.
UPDATE users AS u
INNER JOIN students AS s ON s.user_id = u.user_id
LEFT JOIN users AS existing_user
    ON LOWER(TRIM(existing_user.email)) = LOWER(TRIM(s.email))
   AND existing_user.user_id <> u.user_id
SET u.email = LOWER(TRIM(s.email))
WHERE (u.email IS NULL OR TRIM(u.email) = '')
  AND existing_user.user_id IS NULL;

-- IMPORTANT:
-- Set an email address for each ADMIN account manually before testing password reset.
-- Example (replace with the actual administrator email):
-- UPDATE users SET email = 'admin@example.com' WHERE username = 'admin';

CREATE TABLE IF NOT EXISTS password_reset_otps (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    used_at DATETIME NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_password_reset_otps_user_created (user_id, created_at),
    CONSTRAINT fk_password_reset_otps_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

