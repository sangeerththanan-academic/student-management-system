-- Create OTP storage for the account password-reset workflow.
-- OTP values are never stored in plaintext.

CREATE TABLE IF NOT EXISTS password_reset_otps (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    otp_hash CHAR(64) NOT NULL,

    expires_at DATETIME NOT NULL,

    attempts INT NOT NULL DEFAULT 0,

    used_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_reset_otp_user (user_id),

    CONSTRAINT fk_reset_otp_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);
