USE student_management;

-- CR-026: Password reset OTP table
CREATE TABLE IF NOT EXISTS password_reset_otps (
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

-- Ensure reset token table exists.
-- If it already exists, this statement will leave it unchanged.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    token_hash CHAR(64) NOT NULL UNIQUE,

    expires_at DATETIME NOT NULL,

    used_at DATETIME NULL DEFAULT NULL,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_password_reset_user (user_id),

    INDEX idx_password_reset_expires (expires_at)
);