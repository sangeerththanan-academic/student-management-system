# Implementation Report — CR-019: Student Profile Editing

| Report field | Details |
|---|---|
| Change request | CR-019 — Student Profile Editing |
| System | Student Management System |
| Status | Implemented |
| Implementation date | 2026-10-29 |
| Affected areas | Student dashboard, student API, student data model |

## 1. Executive Summary

CR-019 enables an authenticated student to update their own email address and
phone number from the Student Dashboard. The implementation adds a protected
`PUT /api/students/me` endpoint and an edit mode on the existing profile page.
The backend derives the student identity from the verified JWT user context;
the client cannot choose which student record is updated.

Registration number, full name, and member-since date continue to be displayed
as read-only information. The change uses the existing `students` table and
does not require a database schema migration.

## 2. Objective and Scope

### Objective

Provide students with a self-service way to keep their email and phone contact
details current without requiring an administrator to edit the record.

### Included

- Protected student profile update API.
- Server-side validation of email and phone values.
- Duplicate-email conflict handling.
- Dashboard controls to edit, save, or cancel contact-detail changes.
- Success and error feedback after a save attempt.
- Preservation of the existing profile display and read-only fields.

### Excluded

- Editing registration number, first name, last name, or member-since date.
- Updating another student's profile through this endpoint.
- Updating the student account username or authentication credentials.
- Database schema changes.

## 3. Implementation Details

### 3.1 API endpoint

**Method and path:** `PUT /api/students/me`

**Authentication:** The route uses the existing JWT `authenticate` middleware
and restricts updates to users with the `STUDENT` role.

**Request body:**

```json
{
  "email": "student@example.com",
  "phoneNumber": "+1 555 123 4567"
}
```

The endpoint accepts only the contact fields it needs. It obtains the user ID
from `req.user.userId`, looks up the corresponding student record, and updates
that record by user ID. No student ID is read from the request body or URL.

**Successful response:** HTTP `200`, with a success message and the updated
student record in the `student` property.

**Error responses:**

| Status | Condition |
|---|---|
| `400` | Email or phone is missing or invalid |
| `401` | Authentication is missing, invalid, or expired; handled by the existing middleware |
| `403` | The authenticated user does not have the `STUDENT` role |
| `404` | No student profile is associated with the authenticated user |
| `409` | The email is already registered to another student |
| `500` | An unexpected error prevents the profile update |

### 3.2 Validation and uniqueness

- Email is trimmed, must have a basic valid email structure, and is limited to
  150 characters to match the database column.
- Phone is trimmed, accepts common formatting characters, and is limited to
  20 characters to match the database column.
- The phone number must contain between 7 and 15 digits.
- The backend checks whether another student's record uses the requested
  email. The database's existing unique constraint remains in place, and a
  duplicate-key error is also translated into HTTP `409`.
- Both values are validated on the server regardless of browser-side form
  validation.

### 3.3 Data access

The student model includes a query to check whether an email belongs to
another user and an update query that changes only `email` and
`phone_number`, filtering by the authenticated `user_id`. The existing
`getStudentByUserId` query is then used to return the persisted profile.

The `students` table already contains the required fields and a unique
constraint on email. Therefore, no schema or seed-data update is required.

### 3.4 Student dashboard

The student profile page now has an **Edit contact details** action. In edit
mode, email and phone become required inputs; the student can save the values
or cancel to leave the stored values unchanged. During submission, controls
are disabled and the save action indicates its progress.

On success, the page replaces its displayed profile with the API response and
shows a confirmation message. On failure, it displays the API error, and an
expired authentication response follows the existing logout-and-redirect
behavior. Registration number, full name, and member-since remain display-only.

## 4. Files Changed

| File | Change |
|---|---|
| `backend/src/routes/studentRoutes.js` | Registered the protected student-only `PUT /me` route. |
| `backend/src/controllers/studentController.js` | Added request validation, authenticated-user profile lookup, duplicate-email handling, update orchestration, and response handling. |
| `backend/src/models/studentModel.js` | Added the email uniqueness lookup and contact-only update query scoped by user ID. |
| `frontend/src/pages/StudentDashboardPage.jsx` | Added the contact editing form, save/cancel handling, and user feedback. |
| `frontend/src/styles/studentDashboard.css` | Added styles for contact inputs, buttons, feedback, and narrow-screen layout. |
| `CHANGELOG.md` | Recorded CR-019 in the unreleased changes. |

This report is stored at
`docs/08_change_management/CR-019/Implementation_Report_Student_Profile_Editing.md`.

## 5. Security and Authorization

- The endpoint requires a valid JWT.
- The update route is restricted to the `STUDENT` role.
- The target record is determined exclusively by `req.user.userId`.
- The update query is scoped to that user ID and changes only email and phone.
- Request values are passed as SQL parameters rather than interpolated into
  SQL statements.
- Existing database uniqueness constraints provide a final safeguard against
  duplicate email values.

The existing `GET /api/students/me` route remains unchanged by this change.
Administrator CRUD routes are also unchanged.

## 6. Database and Deployment Impact

No database migration is needed. The implementation uses the existing
`students.email` and `students.phone_number` columns and the existing unique
email constraint.

To deploy, publish the updated backend and frontend using the project's usual
deployment process. Confirm that the backend is connected to the expected
student database and that the frontend is configured to call that backend.
No new environment variables or packages are introduced.

## 7. Verification

The following checks were run for this implementation:

| Check | Result |
|---|---|
| Frontend production build (`npm.cmd run build`) | Passed |
| ESLint on `frontend/src/pages/StudentDashboardPage.jsx` | Passed |
| Backend JavaScript syntax checks (`node --check` on the changed backend files) | Passed |
| `git diff --check` | Passed |
| Full frontend lint (`npm.cmd run lint`) | Not clean due to existing diagnostics in untouched `StudentFormModal.jsx`, `DashboardPage.jsx`, and `ProtectedRoute.jsx` |
| Automated backend/API integration tests | Not run; the backend package does not define an automated test suite |
| Manual end-to-end testing against a running database | Not run |

The successful build and static checks verify compilation, linting of the
changed dashboard page, backend syntax, and patch formatting. They do not
replace end-to-end verification with a running API and database.

## 8. Acceptance Criteria Status

| Acceptance criterion | Status |
|---|---|
| An authenticated student can edit their own email address and phone number from the dashboard. | Implemented |
| Student identity is derived from the verified authenticated user context. | Implemented |
| A client cannot select a different student record by supplying a student ID. | Implemented |
| Invalid email or phone values are rejected by the backend. | Implemented |
| A duplicate email is reported as a conflict. | Implemented |
| Registration number, full name, and member-since remain read-only. | Implemented |
| Existing database schema remains usable without migration. | Implemented |

## 9. Recommended Manual Test Cases

Before release, verify the following using a test environment and test student
accounts:

1. Sign in as a student, edit both contact fields, save, and confirm the
   updated values appear in the profile.
2. Change only the email and save; then repeat with only the phone number.
3. Enter malformed email and phone values and confirm the API rejects them
   without changing the saved profile.
4. Enter another student's email and confirm the API responds with a conflict
   and leaves both records unchanged.
5. Cancel an edit and confirm no update is sent and the displayed values are
   unchanged.
6. Attempt the update without a token and as an administrator; confirm the
   endpoint rejects both requests.
7. Confirm that registration number, full name, and member-since cannot be
   changed through the dashboard form or this endpoint.

## 10. Conclusion

CR-019 has been implemented across the student API, data-access layer, and
student dashboard. The implementation is scoped to the authenticated
student's contact details, preserves the existing read-only profile fields,
and does not require database migration. Build and targeted static checks
passed; API integration and manual end-to-end verification remain recommended
before release.
