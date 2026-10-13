# Implementation Report: CR033 / CR-006
## Last Login Tracking and Display for Student Accounts

---

### Document Information
- **Change Request ID:** CR033 (CR-006)
- **Title:** Last Login Tracking and Display for Student Accounts
- **Target System:** Student Management System
- **Date:** October 13, 2026
- **Status:** Implemented & Verified
- **Document Version:** 1.0

---

## 1. Executive Summary

This implementation report documents all modifications executed for **Change Request CR033 / CR-006: Last Login Tracking and Display for Student Accounts**. 

The objective of this change is to capture and persist the exact date and timestamp whenever a student successfully authenticates into the system, and surface this information in a dedicated "Last Login" column on the Administrator Dashboard. For students who have not yet logged in since account creation, the system gracefully presents a default fallback indicator ("Never logged in").

All requirements across database schema, backend services, authentication workflow, data models, and the frontend dashboard interface have been implemented without introducing regressions to existing student management capabilities.

---

## 2. Requirements & Traceability Matrix

| Requirement ID | Description | Component / File | Status |
| :--- | :--- | :--- | :--- |
| **FR-001** | Add nullable `last_login DATETIME` column to `users` table | `database/schema.sql` | **Implemented** |
| **FR-002** | Update `last_login` timestamp upon successful authentication | `backend/src/models/userModel.js`, `backend/src/controllers/authController.js` | **Implemented** |
| **FR-003** | Failed logins (invalid username or wrong password) must NOT update timestamp | `backend/src/controllers/authController.js` | **Implemented** |
| **FR-004** | Retrieve `last_login` for student records via user relationship | `backend/src/models/studentModel.js` | **Implemented** |
| **FR-005** | Render "Last Login" column on Administrator Dashboard table | `frontend/src/pages/DashboardPage.jsx` | **Implemented** |
| **FR-006** | Display formatted date-time string or "Never logged in" if `NULL` | `frontend/src/pages/DashboardPage.jsx` | **Implemented** |
| **FR-007** | Non-regression: Existing search, edit, delete, and add flows work seamlessly | `frontend/src/pages/DashboardPage.jsx`, `backend/src/models/studentModel.js` | **Implemented** |
| **SEC-001** | Secure authentication and password hash protection preserved | `backend/src/controllers/authController.js` | **Implemented** |
| **SEC-002** | Atomic and parameterized query execution to prevent SQL injection | `backend/src/models/userModel.js`, `backend/src/models/studentModel.js` | **Implemented** |

---

## 3. Detailed File Modifications

A total of **5 files** were modified to support the complete end-to-end functionality of this Change Request.

### 3.1. Database Schema (`database/schema.sql`)
- **Location:** `database/schema.sql` (Lines 22–37)
- **Change:** Added nullable `last_login` column to the `users` table definition with `DEFAULT NULL`.

```sql
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'STUDENT') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME NULL DEFAULT NULL
);
```

#### Database Migration Script Executed:
For existing databases without dropping tables:
```sql
ALTER TABLE users ADD COLUMN last_login DATETIME NULL DEFAULT NULL;
```

---

### 3.2. User Model (`backend/src/models/userModel.js`)
- **Location:** `backend/src/models/userModel.js` (Lines 21–26, 31)
- **Change:** Implemented and exported `updateLastLogin(userId)` helper method utilizing parameterized MySQL queries.

```javascript
const updateLastLogin = async (userId) => {
    await pool.execute(
        "UPDATE users SET last_login = NOW() WHERE user_id = ?",
        [userId]
    );
};

module.exports = {
    findUserByUsername,
    findUserById,
    updateLastLogin
};
```

---

### 3.3. Authentication Controller (`backend/src/controllers/authController.js`)
- **Location:** `backend/src/controllers/authController.js` (Lines 4–8, 45–46)
- **Change:** Imported `updateLastLogin` from `userModel.js` and invoked `await updateLastLogin(user.user_id)` strictly after bcrypt password verification succeeds and immediately prior to issuing the JWT token.

```javascript
const {
    findUserByUsername,
    findUserById,
    updateLastLogin
} = require("../models/userModel");

// ... Inside login() function:
// Compare password
const passwordMatch = await bcrypt.compare(
    password,
    user.password_hash
);

if (!passwordMatch) {
    return res.status(401).json({
        success: false,
        message: "Invalid username or password"
    });
}

// Update last login timestamp (FR-002: only on successful password verification)
await updateLastLogin(user.user_id);

// Create JWT
const token = jwt.sign(
// ...
```

---

### 3.4. Student Model (`backend/src/models/studentModel.js`)
- **Location:** `backend/src/models/studentModel.js` (Lines 40–60)
- **Change:** Updated `getAllStudents()` query to perform an `INNER JOIN` with the `users` table on `s.user_id = u.user_id` and project `u.last_login` alongside standard student profile attributes.

```javascript
// GET ALL STUDENTS
const getAllStudents = async () => {
    const [rows] = await pool.execute(
        `SELECT
            s.student_id,
            s.user_id,
            s.registration_no,
            s.first_name,
            s.last_name,
            s.email,
            s.phone_number,
            s.created_at,
            s.updated_at,
            u.last_login
        FROM students s
        INNER JOIN users u ON s.user_id = u.user_id
        ORDER BY s.student_id DESC`
    );

    return rows;
};
```

---

### 3.5. Dashboard Page (`frontend/src/pages/DashboardPage.jsx`)
- **Location:** `frontend/src/pages/DashboardPage.jsx` (Lines 24–38, 456–458, 493–495)
- **Change:** 
  1. Created a dedicated formatting helper `formatLastLogin()` that checks for null/undefined/empty values and renders `"Never logged in"` or a localized timestamp string (`Month DD, YYYY, HH:MM`).
  2. Added the `<th>Last Login</th>` header in the table heading section between `Phone` and `Actions`.
  3. Added the corresponding `<td>{formatLastLogin(student.last_login)}</td>` cell in the student table row mapping.

```javascript
// Formats a last_login timestamp into a readable string (FR-005, FR-006).
// Returns "Never logged in" when the value is null or undefined.
const formatLastLogin = (lastLogin) => {
    if (!lastLogin) {
        return "Never logged in";
    }

    return new Date(lastLogin).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
};
```

#### Table Header Markup:
```jsx
<th>Phone</th>
<th>Last Login</th>
<th>Actions</th>
```

#### Table Body Row Markup:
```jsx
<td>{student.phone_number}</td>
<td>{formatLastLogin(student.last_login)}</td>
<td>
    <div className="student-actions">
        {/* Edit and Delete buttons */}
    </div>
</td>
```

---

## 4. Verification and Test Results

| Test Scenario | Steps | Expected Outcome | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **New / Unauthenticated Student** | Create student account; do not log in as student. View Admin Dashboard. | "Last Login" displays **"Never logged in"**. | Displayed "Never logged in" for `NULL` value. | **PASS** |
| **Successful Student Login** | Authenticate via `POST /api/auth/login` with valid student credentials. | Database records `last_login = NOW()`; 200 OK with JWT token. | Timestamp updated in `users` table; successful login. | **PASS** |
| **Invalid Password Attempt** | Submit incorrect password for existing student username. | 401 Unauthorized; `last_login` remains unchanged. | Request rejected; timestamp was not updated. | **PASS** |
| **Invalid Username Attempt** | Submit non-existent username for login. | 401 Unauthorized; no database modification. | Request rejected with 401. | **PASS** |
| **Admin Dashboard Display** | Refresh Admin Dashboard after successful student login. | Student row displays formatted date and time (e.g., `Oct 13, 2026, 11:00 AM`). | Formatted date/time correctly rendered in new column. | **PASS** |
| **Client-Side Search Non-Regression** | Filter student list by registration number, name, or email. | Search correctly filters rows and keeps "Last Login" values intact. | Search works seamlessly across all rows. | **PASS** |
| **CRUD Non-Regression** | Add new student, edit student details, delete student record. | Standard student operations proceed without conflict or foreign key issues. | All CRUD operations perform as expected. | **PASS** |

---

## 5. Deployment and Operational Notes

1. **Database Migration:**
   Ensure the migration query has executed on the target environment:
   ```sql
   ALTER TABLE users ADD COLUMN last_login DATETIME NULL DEFAULT NULL;
   ```
2. **Backend Server Restart:**
   The backend Node.js / Express process must be restarted (e.g. `npm run dev` or service reload) so that the updated `authController.js`, `userModel.js`, and `studentModel.js` files are loaded into active execution memory.
3. **Frontend Build:**
   If building for production, run `npm run build` inside `frontend/` to generate the updated static assets. In development mode with Vite, hot-module replacement automatically updates the table and formatting helper.

---

## 6. Sign-off and Conclusion

CR033 / CR-006 has been fully implemented in strict adherence to the project architecture and design specifications. All acceptance criteria and security objectives have been met.
