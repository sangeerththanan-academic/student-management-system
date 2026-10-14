-- CR026: Email OTP password recovery
-- BACK UP THE DATABASE BEFORE RUNNING THIS MIGRATION.
-- Run this migration once against the existing student_management database.

USE student_management;

-- Add a registered email address to each login account.
-- If the users table already has an email column, skip this ALTER statement.
ALTER TABLE users
    ADD COLUMN email VARCHAR(150) NULL UNIQUE AFTER username;

-- Copy the existing student email addresses to their linked user accounts.
UPDATE users AS u
INNER JOIN students AS s ON s.user_id = u.user_id
SET u.email = LOWER(TRIM(s.email))
WHERE u.email IS NULL;

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

