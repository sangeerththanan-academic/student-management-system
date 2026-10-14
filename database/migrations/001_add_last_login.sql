USE student_management;

SET @last_login_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'last_login'
);

SET @migration_sql = IF(
    @last_login_exists = 0,
    'ALTER TABLE users ADD COLUMN last_login DATETIME NULL DEFAULT NULL',
    'SELECT ''users.last_login already exists'' AS migration_status'
);

PREPARE migration_statement FROM @migration_sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;
