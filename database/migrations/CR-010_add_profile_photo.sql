-- CR-010: Student profile image reference
USE student_management;

-- Run once against an existing database.
ALTER TABLE students
ADD COLUMN profile_photo VARCHAR(255) NULL AFTER phone_number;


