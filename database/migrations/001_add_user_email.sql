-- Add account email addresses without dropping existing users or student data.
-- Run this once against the existing student_management database.

USE student_management;

ALTER TABLE users
    ADD COLUMN email VARCHAR(150) NULL AFTER username;

UPDATE users AS u
INNER JOIN students AS s
    ON s.user_id = u.user_id
SET u.email = s.email
WHERE u.email IS NULL;

ALTER TABLE users
    ADD CONSTRAINT uq_users_email UNIQUE (email);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_password_reset_expires (expires_at),
    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
