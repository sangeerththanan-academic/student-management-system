# SOFTWARE CHANGE IMPLEMENTATION REPORT
## CR06: Dashboard Sidebar & Course Management

| Field | Details |
|---|---|
| **Change Request ID** | CR06 |
| **Change Request Title** | Dashboard Sidebar & Course Management |
| **Student Name** | C. Lavasujan |
| **Registration Number** | 24ICT06 |
| **Implementation Status** | Completed |
| **Date** | 28 October 2026 |

---

## 1. Change Request Summary

### 1.1 Business Requirement
The Admin Dashboard should provide sidebar navigation so administrators can switch between management modules. A new Courses module should allow administrators to create and manage course records through the dashboard.

### 1.2 Existing Behaviour
Before implementation:
- `DashboardPage.jsx` directly rendered the student list.
- Student-management logic was coupled directly to the `DashboardPage` layout.
- The Admin Dashboard did not provide the specified Students/Courses sidebar navigation structure.
- A dedicated Courses management interface and supporting course API/database structure were not present.

### 1.3 Requested Change
Refactor the Admin Dashboard into a layout with a Dashboard Sidebar and nested module routes, move student-specific logic into a dedicated `StudentsView` component, and introduce a Courses module backed by course database, route, controller, and API functionality:
- Change `/dashboard` into a layout route and add nested `/dashboard/students` and `/dashboard/courses` routes.
- Create `DashboardSidebar.jsx` with Students and Courses navigation links and active-state styling.
- Refactor `DashboardPage.jsx` to render the sidebar, header, and React Router `<Outlet />`.
- Move student fetching, search, and table logic into `StudentsView.jsx`.
- Create `CoursesView.jsx` with heading, Add Course button, empty state, and course list/table.
- Create `CourseFormModal.jsx` with Course Code, Course Name, Description, and Credits fields.
- Add form validation and API submission for course creation.
- Add a courses database table and POST/GET course endpoints, controllers, and route registration.
- Connect the frontend course functions to the backend API and verify functionality.

---

## 2. Implementation

### 2.1 Implementation Summary
CR06 was implemented systematically across all architecture layers:
1. **Database Layer**: Updated `database/schema.sql` to add the `courses` table and `database/seed.sql` with sample course data.
2. **Backend API Layer**: Implemented `courseModel.js`, `courseController.js`, and `courseRoutes.js`, registering endpoints at `/api/courses` under `app.js`. Protected endpoints using `authenticate` and `authorizeRoles("ADMIN")`.
3. **Frontend API Layer**: Added `courseService.js` to provide client API functions for course retrieval and creation.
4. **Frontend Layout & Routing**: Configured nested routing in `AppRoutes.jsx`, created `DashboardSidebar.jsx` with `dashboard-sidebar.css`, and transformed `DashboardPage.jsx` into a layout wrapper.
5. **Student Module Extraction**: Moved all student state, search (CR-001), modal handling, and table rendering to `StudentsView.jsx` preserving complete functionality.
6. **Courses Module**: Built `CoursesView.jsx` with table display, empty state, and count indicator, plus `CourseFormModal.jsx` for course creation with client-side validation.

### 2.2 Affected Files

| File | Change | Purpose |
|---|---|---|
| `database/schema.sql` | Modified | Added `courses` table definition |
| `database/seed.sql` | Modified | Added course seed data and verification queries |
| `backend/src/models/courseModel.js` | Created | Database interaction queries for courses |
| `backend/src/controllers/courseController.js` | Created | Course creation and retrieval business logic |
| `backend/src/routes/courseRoutes.js` | Created | Express route definitions for `/api/courses` |
| `backend/src/app.js` | Modified | Registered `/api/courses` routes |
| `backend/test/courseController.test.js` | Created | Automated route and controller unit tests |
| `frontend/src/services/courseService.js` | Created | Course frontend API service functions |
| `frontend/src/components/DashboardSidebar.jsx` | Created | Sidebar navigation component for modules |
| `frontend/src/components/dashboard-sidebar.css` | Created | Sidebar layout and active navigation styling |
| `frontend/src/components/CourseFormModal.jsx` | Created | Course creation modal with field validation |
| `frontend/src/pages/admin/StudentsView.jsx` | Created | Extracted student management module view |
| `frontend/src/pages/admin/CoursesView.jsx` | Created | New Courses management module view |
| `frontend/src/pages/DashboardPage.jsx` | Refactored | Layout wrapper with header, sidebar, and Outlet |
| `frontend/src/routes/AppRoutes.jsx` | Modified | Nested routing under `/dashboard` |
| `frontend/src/styles/dashboard.css` | Modified | Layout styling for side-by-side view & course UI |
| `CHANGELOG.md` | Modified | Documented CR06 release notes under v1.2.0 |

### 2.3 Additional Files Justification
- `backend/src/models/courseModel.js`: Created to maintain consistency with the existing MVC architecture (`studentModel.js`).
- `backend/test/courseController.test.js`: Created to provide automated unit and route verification.
- `frontend/src/services/courseService.js`: Created as permitted by FR-022 to keep course API operations clean and modular.

---

## 3. Testing & Verification

### 3.1 Testing Approach
The implementation was verified using automated unit tests on the backend and production bundling checks on the frontend.

Testing Types:
- Automated route and controller testing (`npm test` in backend)
- Frontend compilation & bundling verification (`npm run build` in frontend)
- Static code analysis (`npm run lint` in frontend)
- Database schema and constraint verification

Environment: Development (Node.js v24.13.0, Vite v8.3.3, MySQL)

### 3.2 Test Cases & Results

| Test ID | Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| TC-01 | Nested routing for default route | `/dashboard` renders `/dashboard/students` by default | Successfully navigates and renders StudentsView | Pass |
| TC-02 | Nested routing for courses route | `/dashboard/courses` renders CoursesView | Successfully renders CoursesView | Pass |
| TC-03 | Sidebar navigation & active state | Sidebar links highlight based on active route | NavLink applies active class accurately | Pass |
| TC-04 | Student view extraction regression | All student search, filter, and table features intact | Search, clear, and table rendering functional | Pass |
| TC-05 | Course form field validation | Missing fields or invalid credits rejected before submission | Validation messages displayed; submission prevented | Pass |
| TC-06 | Course creation API endpoint | `POST /api/courses` validates payload and inserts record | Validated payload, created course, returns 201 | Pass |
| TC-07 | Duplicate course code rejection | `POST /api/courses` with duplicate code returns 409 | Duplicate detected, returns 409 conflict | Pass |
| TC-08 | Course listing API endpoint | `GET /api/courses` returns course list and count | Returns 200 with JSON course list and count | Pass |
| TC-09 | CoursesView UI rendering | Displays heading, Add Course button, count, and table | All elements rendered according to requirements | Pass |
| TC-10 | CoursesView empty state | When 0 courses exist, shows friendly empty state | Shows "No courses found" and Add Course button | Pass |
| TC-11 | Frontend production build | `npm run build` builds without errors or missing imports | Vite build completed successfully | Pass |

---

## 4. Acceptance Criteria Verification

| ID | Acceptance Criterion | Verification Method | Status |
|---|---|---|---|
| AC-001 | Dashboard Layout renders sidebar and active module outlet | Layout inspection & routing | Met |
| AC-002 | Students module accessible through `/dashboard/students` (default) | Route configuration test | Met |
| AC-003 | Courses module accessible through `/dashboard/courses` | Route configuration test | Met |
| AC-004 | Sidebar clearly indicates active module | Active class verification | Met |
| AC-005 | Student fetching, search, table works in StudentsView | Code verification & build | Met |
| AC-006 | CoursesView displays heading, Add Course, empty state, table | Component inspection | Met |
| AC-007 | CourseFormModal opens and contains Code, Name, Description, Credits | Component inspection | Met |
| AC-008 | Invalid course form input prevented from submission | Form validation tests | Met |
| AC-009 | Valid submission creates course through `POST /api/courses` | Controller tests & service | Met |
| AC-010 | `GET /api/courses` returns course data for Courses view | Route & controller test | Met |
| AC-011 | Database schema contains required `courses` table | Schema verification | Met |
| AC-012 | Course routes registered by backend application | Express app verification | Met |
| AC-013 | Course creation and retrieval handled by `courseController.js` | Automated controller tests | Met |
| AC-014 | Frontend uses configured API service function(s) | `courseService.js` inspection | Met |
| AC-015 | Dashboard refactor does not break existing Students module | Regression verification | Met |
| AC-016 | Courses frontend communicates with backend course API | Service & integration check | Met |
| AC-017 | Additional files modified are documented and justified | Section 2.3 of this report | Met |

---

## 5. Final Result

| Item | Result |
|---|---|
| Requirements | Met |
| Implementation | Completed |
| Testing | Passed |
| Acceptance Criteria | All Met |
| Existing Functionality | Verified |
| Final Status | Accepted |

### 5.1 Final Summary
CR06 has been fully implemented in strict adherence to the Change Request Report and Impact Analysis. The Admin Dashboard now operates as an extensible layout with a responsive `DashboardSidebar`, active-state indicators, and nested routes for `/dashboard/students` and `/dashboard/courses`. The pre-existing student management functionality was successfully extracted into `StudentsView.jsx` without regression. A complete Courses module was delivered across the database schema, backend REST API, frontend service, and interactive UI views.

~ END OF REPORT ~

