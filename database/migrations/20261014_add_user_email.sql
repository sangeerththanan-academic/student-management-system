-- Add account email support for login-account password recovery.
-- Existing student account emails are copied from their student profiles.
-- Admin accounts without a known email remain NULL until one is assigned.

SET @user_email_column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'email'
);

SET @user_email_column_migration = IF(
    @user_email_column_exists = 0,
    'ALTER TABLE users ADD COLUMN email VARCHAR(150) NULL AFTER username',
    'SELECT ''users.email already exists'' AS migration_status'
);

PREPARE user_email_column_statement FROM @user_email_column_migration;
EXECUTE user_email_column_statement;
DEALLOCATE PREPARE user_email_column_statement;

ALTER TABLE users
    MODIFY COLUMN email VARCHAR(150) NULL;

UPDATE users u
JOIN students s ON s.user_id = u.user_id
SET u.email = s.email
WHERE u.email IS NULL;

SET @user_email_index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'email'
      AND NON_UNIQUE = 0
      AND SEQ_IN_INDEX = 1
);

SET @user_email_index_migration = IF(
    @user_email_index_exists = 0,
    'ALTER TABLE users ADD UNIQUE INDEX uq_users_email (email)',
    'SELECT ''uq_users_email already exists'' AS migration_status'
);

PREPARE user_email_index_statement FROM @user_email_index_migration;
EXECUTE user_email_index_statement;
DEALLOCATE PREPARE user_email_index_statement;
