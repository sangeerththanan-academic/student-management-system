USE student_management;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_login DATETIME NULL;
