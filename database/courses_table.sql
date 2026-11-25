-- One-time migration for existing databases. Fresh installs create this table
-- through schema.sql.
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_code VARCHAR(20) NOT NULL UNIQUE,
  course_name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  credits TINYINT UNSIGNED NOT NULL DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
