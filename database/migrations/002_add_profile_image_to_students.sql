USE student_management;

-- Add nullable profile image path (e.g. uploads/profiles/REG001.jpg)
-- Run once on an existing database. No other columns are changed.
ALTER TABLE students
    ADD COLUMN profile_image VARCHAR(255) NULL AFTER phone_number;
