-- Add the CR-010 image reference to existing databases.
SET @profile_image_column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'students'
      AND COLUMN_NAME = 'profile_image'
);

SET @profile_image_migration = IF(
    @profile_image_column_exists = 0,
    'ALTER TABLE students ADD COLUMN profile_image VARCHAR(255) NULL',
    'SELECT ''students.profile_image already exists'' AS migration_status'
);

PREPARE profile_image_statement FROM @profile_image_migration;
EXECUTE profile_image_statement;
DEALLOCATE PREPARE profile_image_statement;
