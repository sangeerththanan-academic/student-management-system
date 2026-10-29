-- CR26: add the account email used to deliver password reset OTPs.
-- Existing student emails are copied from their student profiles.
-- Existing admin accounts remain NULL until an email is assigned to them.
ALTER TABLE users
    ADD COLUMN email VARCHAR(150) NULL;

UPDATE users AS u
JOIN students AS s ON s.user_id = u.user_id
SET u.email = s.email
WHERE u.email IS NULL;

ALTER TABLE users
    ADD UNIQUE INDEX uq_users_email (email);

CREATE TABLE IF NOT EXISTS password_reset_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    otp_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reset_otp_hash (otp_hash),
    INDEX idx_reset_otp_user (user_id),
    CONSTRAINT fk_reset_otp_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);
