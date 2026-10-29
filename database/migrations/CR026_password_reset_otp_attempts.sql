-- CR26: track failed OTP checks to limit six-digit code guessing.
-- Safe to run whether the setup migration already created the column or not.
SET @cr026_attempts_sql = IF(
    (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'password_reset_otps'
          AND COLUMN_NAME = 'attempts'
    ) = 0,
    'ALTER TABLE password_reset_otps ADD COLUMN attempts TINYINT UNSIGNED NOT NULL DEFAULT 0',
    'SELECT ''password_reset_otps.attempts already exists'''
);

PREPARE cr026_attempts_statement FROM @cr026_attempts_sql;
EXECUTE cr026_attempts_statement;
DEALLOCATE PREPARE cr026_attempts_statement;
