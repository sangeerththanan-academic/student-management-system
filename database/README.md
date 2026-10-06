# Student Management System – Database

## 1. Overview

This directory contains the database scripts for the Student Management System.

The application uses **MySQL** as the database management system.

The database currently supports:

- User authentication
- User role management
- Student registration
- Student record management
- Student profile viewing

---

## 2. Database Technology

| Item | Technology |
|---|---|
| Database Management System | MySQL |
| Database Language | SQL |
| Database Name | `student_management` |

---

## 3. Database Files

```text
database/
├── README.md
├── schema.sql
└── seed.sql
````

 ### `schema.sql`

 Contains the database structure, including:

 - Database creation
- Tables
- Primary keys
- Foreign keys
- Unique constraints
- Data types
- Relationships
- Database constraints

 ### `seed.sql`

 Contains initial/sample data required for development and testing.

 It includes:

 - Administrator account
- Student accounts
- Sample student records

 The sample passwords are for development/testing only.

---

 ## 4\. Current Database Structure

 The current database contains two main tables:

```
users
  |
  | 1
  |
  | 0..1
  |
students
```

 A user may have zero or one associated student record.

 - Administrator users do not require a student profile.
- Student users should have an associated student profile.

---

 ## 5\. Users Table

 The `users` table stores authentication and role information.

 | Field | Description |
| --- | --- |
| `user_id` | Unique user identifier |
| `username` | Login username |
| `password_hash` | Hashed password |
| `role` | User role |
| `created_at` | Account creation date |
| `updated_at` | Last update date |

Supported roles:

 - `ADMIN`
- `STUDENT`

 Passwords must not be stored as plain text.

---

 ## 6\. Students Table

 The `students` table stores student information.

 | Field | Description |
| --- | --- |
| `student_id` | Unique student identifier |
| `user_id` | Related user account |
| `registration_no` | Student registration number |
| `first_name` | Student first name |
| `last_name` | Student last name |
| `email` | Student email |
| `phone_number` | Student phone number |
| `created_at` | Record creation date |
| `updated_at` | Last update date |

---

 ## 7\. Database Relationship

 The `students.user_id` column references `users.user_id`.

```
users.user_id
      |
      | 1
      |
      | 0..1
      ↓
students.user_id
```

 This ensures that a student record cannot reference a non-existing user account.

---

 ## 8\. Database Setup

 ### Prerequisites

 Install:

 - MySQL Server
- MySQL Workbench or another MySQL client

 Make sure the MySQL server is running.

 ### Create the Database

 Execute `schema.sql`.

 Using the MySQL command line:

```
mysql -u root -p < schema.sql
```

 Alternatively, open `schema.sql` in MySQL Workbench and execute it.

 ### Load Sample Data

 After creating the database, execute `seed.sql`:

```
mysql -u root -p student_management < seed.sql
```

 Alternatively, open `seed.sql` in MySQL Workbench and execute it.

---

 ## 9\. Verify the Database

 Connect to MySQL and run:

```
USE student_management;

SHOW TABLES;
```

 The expected tables are:

```
users
students
```

 To view the sample users:

```
SELECT * FROM users;
```

 To view the sample students:

```
SELECT * FROM students;
```

---

 ## 10\. Database Constraints

 The current database applies the following important constraints.

 ### Users

 - `user_id` is the primary key.
- `username` must be unique.
- Required fields cannot be `NULL`.
- `role` must be either `ADMIN` or `STUDENT`.

 ### Students

 - `student_id` is the primary key.
- `user_id` references `users.user_id`.
- `user_id` must be unique.
- `registration_no` must be unique.
- `email` must be unique.
- Required student information cannot be `NULL`.

---

 ## 11\. Security

 Database credentials should not be hard-coded into application source code.

 Use environment variables for database configuration.

 Example:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=student_management
DB_PORT=3306
```

 The `.env` file should not be committed to Git.

 Passwords must be securely hashed before being stored in the database.

---

 ## 12\. Application Architecture

 The React frontend does not connect directly to MySQL.

 The application follows this architecture:

```
React Frontend
      |
      | HTTP / REST API
      ↓
Node.js + Express
      |
      | Database Access
      ↓
MySQL
```

 The backend is responsible for:

 - Database access
- Data validation
- Business rules
- Authentication
- Authorization
- Error handling

---

 ## 13\. Development Guidelines

 When modifying the database:

 - Update `schema.sql` when the database structure changes.
- Update `seed.sql` when sample data changes.
- Test database changes before using them with the application.
- Do not commit database passwords.
- Do not commit real sensitive student information.
- Keep database changes consistent with the application requirements.

---

 ## 14\. Current Version

 | Item | Value |
| --- | --- |
| Database Version | 1.0 |
| Database Name | `student_management` |
| Database Technology | MySQL |
| Tables | `users`, `students` |
| Schema File | `schema.sql` |
| Seed File | `seed.sql` |