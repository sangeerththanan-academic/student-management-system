# SOFTWARE CHANGE IMPLEMENTATION REPORT

## CR06: Dashboard Sidebar & Course Management

| Field | Details |
|---|---|
| Change Request ID | CR06 |
| Change Request Title | Dashboard Sidebar & Course Management |
| Prepared By | C. Lavasujan |
| Registration Number | 24ICT06 |
| Implementation Status | Implemented; runtime/database verification pending |
| Date | 23 November 2026 |

## 1. Change Request Summary

### 1.1 Business Requirement

The administrator dashboard needed sidebar navigation between Students and Courses. The request also required nested dashboard routes, preservation of current student-management behaviour, and a course catalogue with course creation backed by a database and authenticated API.

### 1.2 Existing Behaviour

- `/dashboard` directly rendered the student list, search, and student form actions.
- There was no dashboard sidebar or nested Students/Courses module routing.
- There was no course catalogue, course form, courses table, or courses API.

### 1.3 Requested Change

- Refactor `/dashboard` into a shared layout with sidebar, header, and nested content outlet.
- Provide `/dashboard/students` as the default module and `/dashboard/courses` for course management.
- Move existing student list, search, and CRUD interface into `StudentsView.jsx`.
- Add a Courses view, course creation form, validation, course database table, and admin-only GET/POST endpoints.

## 2. Implementation

### 2.1 Implementation Summary

CR06 was implemented across the frontend, backend, and database schema. The admin dashboard now provides a responsive sidebar with active navigation states. The root dashboard route redirects to Students, and the dashboard layout renders its nested module through React Router's outlet.

Existing student loading, search, add/edit modal, and delete behaviour were moved into `StudentsView.jsx`. A Courses module was added with a course list, empty state, refresh action, and Add Course modal. Course submissions are validated in the browser and on the server. Course endpoints reuse the application's JWT authentication and ADMIN role middleware.

### 2.2 Affected Files

| File | Change | Purpose |
|---|---|---|
| `frontend/src/routes/AppRoutes.jsx` | Modified | Added nested dashboard routes and default Students redirect. |
| `frontend/src/pages/DashboardPage.jsx` | Modified | Converted to shared dashboard layout with sidebar, header, logout, role handling, and outlet. |
| `frontend/src/components/DashboardSidebar.jsx` | Added | Added Students/Courses navigation, icons, and active-state styling. |
| `frontend/src/styles/dashboard.css` | Modified | Added dashboard shell, responsive sidebar, navigation and course UI styles. |
| `frontend/src/pages/admin/StudentsView.jsx` | Added | Relocated student fetching, search, table, and existing student actions. |
| `frontend/src/pages/admin/CoursesView.jsx` | Added | Added course listing, loading/error/empty states, and create action. |
| `frontend/src/components/CourseFormModal.jsx` | Added | Added validated Course Code, Course Name, Description, and Credits form. |
| `backend/src/routes/courseRoutes.js` | Added | Added authenticated, ADMIN-only GET and POST course routes. |
| `backend/src/controllers/courseController.js` | Added | Added course retrieval, validation, insertion, and duplicate-code handling. |
| `backend/src/app.js` | Modified | Registered `/api/courses`. |
| `database/schema.sql` | Modified | Added the courses table definition. |

Additional files: None.

### 2.3 Technical Changes

#### Dashboard Layout and Routing

- `/dashboard` is a protected parent route with nested `students` and `courses` routes.
- The index route redirects to `/dashboard/students`.
- Sidebar links use route-aware active states.
- Dashboard shared header retains administrator identity and logout behaviour.
- Sidebar changes to a compact horizontal navigation on narrow screens.

#### Students Module

- Existing student retrieval, client-side search, count, empty/no-match states, add/edit modal, and delete action were moved to `StudentsView.jsx`.
- Search still operates on loaded records and preserves registration number, first/last/full name, and email matching.
- Existing student endpoints and student identity handling were retained.

#### Courses Module

- The course list retrieves records using `GET /api/courses` and displays course code, name, description, and credits.
- The Add Course modal submits to `POST /api/courses` and reloads the list after success.
- Course code is trimmed and normalized to uppercase; credits must be an integer from 1 through 30. Required fields are checked on both client and server.
- Duplicate course codes return HTTP 409.
- Both course routes require a valid JWT and ADMIN role.

#### Database

The schema now defines `courses` with an auto-incrementing primary key, unique course code, course name, description, credits, and created/updated timestamps.

## 3. Testing and Verification

### 3.1 Verification Performed

| Check | Result | Notes |
|---|---|---|
| Frontend production build (`npm run build`) | Passed | Vite production bundle completed successfully. |
| `node --check` for `courseController.js` | Passed | No JavaScript syntax errors. |
| `node --check` for `courseRoutes.js` | Passed | No JavaScript syntax errors. |
| Frontend lint (`npm run lint`) | Not clean | Existing issues in `StudentFormModal.jsx`, `StudentDashboardPage.jsx`, and `ProtectedRoute.jsx`; initial lint also flagged effect patterns, which were adjusted in the new/moved views. A full clean lint run was not confirmed afterward. |
| Database schema execution | Not performed | No live database migration/schema run was performed. |
| API integration / browser workflow | Not performed | No live backend/database course create/list workflow was run. |

### 3.2 Test Summary

| Verification item | Count / Status |
|---|---|
| Production build | Passed |
| New backend syntax checks | Passed (2 files) |
| Live API and persistence checks | Pending |
| Overall verification | Partially verified |

## 4. Acceptance Criteria Verification

| ID | Acceptance Criterion | Status |
|---|---|---|
| AC-001 | Dashboard layout renders sidebar and module outlet. | Implemented; build passed |
| AC-002 | Students is available at `/dashboard/students` and is the default. | Implemented; build passed |
| AC-003 | Courses is available at `/dashboard/courses`. | Implemented; build passed |
| AC-004 | Sidebar indicates the active module. | Implemented |
| AC-005 | Student loading, search, and table remain in the Students module. | Refactored; runtime regression check pending |
| AC-006 | Courses view includes heading, Add Course, empty state, and list/table. | Implemented; build passed |
| AC-007 | Course modal includes the four requested fields. | Implemented; build passed |
| AC-008 | Invalid course input is blocked. | Client/server validation implemented |
| AC-009 | Valid course submission creates a course through POST. | Implemented; live API verification pending |
| AC-010 | GET course data is displayed by the Courses view. | Implemented; live API verification pending |
| AC-011 | Database schema includes the courses table. | Schema added; execution pending |
| AC-012 | Backend application registers course routes. | Implemented; syntax checked |
| AC-013 | Course controller handles create and list operations. | Implemented; syntax checked |
| AC-014 | Frontend uses the configured API service. | Implemented |
| AC-015 | Existing Students behaviour is retained. | Refactored; runtime regression check pending |
| AC-016 | Courses UI communicates successfully with backend. | Pending live integration verification |
| AC-017 | Additional file changes are identified. | Met; all files listed above |

## 5. Evidence

No screenshots or live database/API execution evidence were captured during this implementation. The production build output and backend syntax checks are recorded in Section 3.

## 6. Final Result

| Item | Result |
|---|---|
| Requirements | Implemented in code; runtime verification pending |
| Implementation | Completed |
| Build and syntax verification | Passed |
| Acceptance criteria | Partially verified |
| Final status | Pending live database/API and browser verification |

### 6.1 Final Summary

CR06 adds a responsive Students/Courses sidebar and nested dashboard routes, moves existing student-management UI logic into a dedicated Students view, and adds a Courses catalogue and create form. The course API uses the current authentication and administrator authorization middleware, and the database schema includes the required courses table. The frontend production build and syntax checks for the new backend files passed. Full acceptance requires applying the schema and checking authenticated course creation/retrieval and existing Students behaviour against a running application.

### 6.2 Issues / Limitations

- Run the updated `database/schema.sql` against the target MySQL database before using the Courses module.
- Live POST/GET API integration, database persistence, and browser navigation have not been verified.
- Frontend lint reports existing errors in `StudentFormModal.jsx`, `StudentDashboardPage.jsx`, and `ProtectedRoute.jsx`; a clean full lint run has not been established.
- Course editing and deletion are outside the supplied CR06 scope.

**Prepared By:** C. Lavasujan  
**Registration Number:** 24ICT06  
**Date:** 23 November 2026  
**Signature:** ______________________________

---

*End of Report*
