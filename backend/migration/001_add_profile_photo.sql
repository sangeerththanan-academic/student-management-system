USE student_management;

-- CR-010: Add student profile image reference.
-- Existing student records will have NULL until a photo is uploaded.

ALTER TABLE students
ADD COLUMN profile_photo VARCHAR(255) NULL
AFTER phone_number;