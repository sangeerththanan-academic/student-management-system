# Changelog

All notable changes to the Student Management System are documented in this file.

## [1.2.0] - 2026-10-28

### Added

#### CR-006: Dashboard Sidebar & Course Management

- Added `DashboardSidebar.jsx` component with navigation links to Students and Courses.
- Added active-state styling and responsive side-by-side navigation layout (`dashboard-sidebar.css`).
- Implemented nested routing under `/dashboard`:
  - `/dashboard` automatically renders the default `/dashboard/students` module.
  - `/dashboard/students` for student management.
  - `/dashboard/courses` for course management.
- Extracted student fetching, search, filter, and table responsibilities into a dedicated `StudentsView.jsx` component.
- Implemented `CoursesView.jsx` with section heading, "+ Add Course" button, course count, empty state, and responsive table.
- Implemented `CourseFormModal.jsx` modal dialog with Course Code, Course Name, Description, and Credits fields.
- Added client-side input validation for course creation preventing invalid or negative inputs.
- Created `courseService.js` frontend API service providing `getCourses`, `createCourse`, and `getCourseById`.
- Added `courses` table definition to `database/schema.sql` and development seed data to `database/seed.sql`.
- Added backend `courseModel.js` for course database queries and transactions.
- Added backend `courseController.js` with validation, duplicate detection, creation, and retrieval logic.
- Added backend `courseRoutes.js` implementing `POST /api/courses` and `GET /api/courses` protected by administrator authentication and authorization.
- Registered `/api/courses` routes in `backend/src/app.js`.
- Added automated unit and route verification tests in `backend/test/courseController.test.js`.

### Changed

- Refactored `DashboardPage.jsx` from a monolithic student view into a clean layout container with header, sidebar, and React Router `<Outlet />`.
- Updated `frontend/src/routes/AppRoutes.jsx` to configure nested child routes under `/dashboard`.
- Preserved existing student management features, client-side search (CR-001), modal operations, and CRUD functionality without regression.

---

## [1.1.0] - 2026-10-05

### Added

#### CR-001: Client-Side Student Search and Filtering

- Added client-side search to the administrator student list.
- Search supports registration number.
- Search supports first name.
- Search supports last name.
- Search supports full name.
- Search supports email address.
- Added partial matching.
- Added case-insensitive matching.
- Added search input normalization for leading, trailing, and repeated spaces.
- Added matching student count.
- Added Clear Search functionality.
- Added no-result state.
- Filtering is performed on already-loaded student records.
- Existing Edit and Delete functionality is preserved.
- Existing student IDs are used for Edit and Delete operations.
- Existing authentication and authorization remain unchanged.

### Changed

- Updated the administrator dashboard to support student search and filtering.
- Updated the dashboard interface to display search-related states and results.

### Technical Notes

- CR-001 is implemented entirely on the frontend.
- No database changes were required.
- No backend API changes were required.
- No new API endpoints were introduced.
- The existing `GET /api/students/` endpoint continues to load the student list.
- Search filtering is performed client-side after the student records are loaded.

### Testing

CR-001 was manually verified against the defined functional requirements
and acceptance criteria.

The implementation verified:

- Registration number search.
- Name search.
- Email search.
- Partial matching.
- Case-insensitive matching.
- Space normalization.
- Result counting.
- Clear Search.
- No-result handling.
- Edit and Delete functionality.
- Existing administrator CRUD functionality.

---

## [1.0.0] - Baseline

### Added

#### Authentication

- User authentication functionality.
- Role-based access for `ADMIN` and `STUDENT` users.
- Secure password storage using password hashes.

#### Student Management

- Student account creation.
- Student record creation, viewing, updating, and deletion.
- Student lookup by user ID.
- Student registration number management.
- Student personal and contact information management.

#### Frontend

- React-based frontend application.
- User authentication interface.
- Administrator student management interface.
- Student record viewing and management.
- Student Edit and Delete functionality.

#### Backend

- Node.js and Express backend API.
- Authentication API.
- Student management API.
- Student lookup functionality.
- Backend validation and error handling.
- Administrator authorization for protected student management operations.

#### Database

- MySQL database implementation.
- `users` table.
- `students` table.
- User-student relationship.
- Primary key constraints.
- Foreign key constraints.
- Unique constraints.
- Initial development and test seed data.

### Technology Stack

- React
- Node.js
- Express
- MySQL
- Git and GitHub

### Baseline Scope

Version 1.0 provides the core authentication and student management
functionality required by the initial system requirements.

The Version 1.0 baseline did not include client-side student search and
filtering.

### Baseline Notes

Version 1.0 represents the initial system baseline.

CR-001 was subsequently implemented as a controlled frontend change,
resulting in Version 1.1.0.

Future changes should be implemented according to the requirements provided
for the relevant Change Request.
