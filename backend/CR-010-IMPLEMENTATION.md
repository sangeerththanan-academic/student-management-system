# CR-010 Implementation Guide — Student Profile Image Upload

## What changed
- Added optional profile image upload on the administrator's Add Student form.
- Allowed PNG, JPG and JPEG only; client and server validate extensions, MIME type, file signature, and a 5 MB maximum.
- Generated random server-side file names and store images in `backend/uploads/students/`.
- Stored only `/uploads/students/<generated-name>` in `students.profile_photo`.
- Displayed a profile photo or placeholder in the admin student list.
- Kept the existing student creation transaction, authorization middleware, edit and delete routes in place.

## Files changed
- `backend/package.json` — added Multer.
- `backend/src/app.js` — static image serving and upload error handling.
- `backend/src/controllers/studentController.js` — stores profile reference with new student and cleans up failed uploads.
- `backend/src/middleware/studentImageUpload.js` — new secure upload middleware.
- `backend/src/models/studentModel.js` — inserts and selects `profile_photo`.
- `backend/src/routes/studentRoutes.js` — upload middleware added only to the authenticated admin create route.
- `database/schema.sql` — new `profile_photo` column for fresh databases.
- `database/migrations/CR-010_add_profile_photo.sql` — migration for an existing database.
- `frontend/src/components/StudentFormModal.jsx` — file input, preview, client validation and multipart form submission.
- `frontend/src/pages/DashboardPage.jsx` — image column and placeholder.
- `frontend/src/services/api.js` — supports FormData without manually setting multipart Content-Type.
- `frontend/src/styles/dashboard.css` — upload and image styling.
- `frontend/public/student-placeholder.svg` — default image.
- `backend/.gitignore` — ignores uploaded student files.

## Setup (Windows)
1. Back up the current project and extract this archive to a separate folder.
2. Copy your original `backend/.env` and `frontend/.env` into the corresponding folders. The environment files are intentionally not included in this archive.
3. If using the existing MySQL database, run `database/migrations/CR-010_add_profile_photo.sql` once in MySQL Workbench. Do not run the migration twice.
4. Open Command Prompt in `backend` and run:
   ```
   npm install
   npm run dev
   ```
   `npm install` will install Multer and update `package-lock.json`.
5. Open another Command Prompt in `frontend` and run:
   ```
   npm install
   npm run dev
   ```
6. Open the Vite local URL and log in as an administrator.

## Test cases
- Add student with no image.
- Add student with `.png`, `.jpg`, and `.jpeg`.
- Try PDF, TXT, EXE, renamed non-image file, and image larger than 5 MB.
- Verify uploaded image appears beside the correct student after refresh.
- Verify students without images show the placeholder.
- Verify edit and delete still work.
- Verify a non-admin cannot call the create-student endpoint.
- Restart the backend and verify stored images still load.

## Notes
- Profile images are optional and are added during student creation, as requested by CR-010.
- Existing records have `profile_photo = NULL`, so the placeholder is shown.
- Uploaded files are served as static images; no HTML rendering is used.
- The change request's implementation status should be reported as completed only after these tests are actually run. The archive was prepared from source review; it does not claim end-to-end tests were run against your local MySQL environment.
- The supplied Impact Analysis contains the label `CR-002` in a few paragraphs although the document title and request are CR-010. This implementation follows CR-010.


