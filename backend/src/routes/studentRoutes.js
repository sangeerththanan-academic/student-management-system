<<<<<<< HEAD
const express = require("express");
const router = express.Router();
=======
// UPDATE STUDENT WITH OPTIONAL PROFILE IMAGE
// PUT /api/students/:id
const editStudent = async (req, res) => {
    const studentId = req.params.id;
    let newImageSaved = false;
>>>>>>> a3803ff97bc2415108026492f3744f55b3cd4c38

    try {
        const {
            registrationNo,
            firstName,
            lastName,
            email,
            phoneNumber
        } = req.body;

<<<<<<< HEAD
const { authenticate } = require("../middleware/authMiddleware");

const uploadStudentImage =
    require("../middleware/studentUploadMiddleware");

// GET /api/students/me
router.get("/me", authenticate, getMyProfile);

// GET /api/students
router.get("/", authenticate, getStudents);

// GET /api/students/:id
router.get("/:id", authenticate, getStudent);

// POST /api/students
router.post(
    "/",
    authenticate,
    uploadStudentImage.single("profileImage"),
    addStudent
);

// PUT /api/students/:id
router.put(
    "/:id",
    authenticate,
    uploadStudentImage.single("profileImage"),
    editStudent
);

// DELETE /api/students/:id
router.delete("/:id", authenticate, removeStudent);

module.exports = router;
=======
        // Validate required student fields
        if (
            !registrationNo?.trim() ||
            !firstName?.trim() ||
            !lastName?.trim() ||
            !email?.trim() ||
            !phoneNumber?.trim()
        ) {
            if (req.file) {
                removeUploadedFile(req.file);
            }

            return res.status(400).json({
                success: false,
                message: "All student fields are required."
            });
        }

        // Find the existing student and current image
        const existingStudent = await getStudentById(studentId);

        if (!existingStudent) {
            if (req.file) {
                removeUploadedFile(req.file);
            }

            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        // Update the student's normal details
        await updateStudent(
            studentId,
            registrationNo.trim(),
            firstName.trim(),
            lastName.trim(),
            email.trim(),
            phoneNumber.trim()
        );

        let imagePath = existingStudent.profile_image || null;

        // Replace the profile image only when a new file is uploaded
        if (req.file) {
            const newImagePath = getProfileImageUrl(req.file.filename);

            await pool.execute(
                `UPDATE students
                 SET profile_image = ?
                 WHERE student_id = ?`,
                [newImagePath, studentId]
            );

            imagePath = newImagePath;
            newImageSaved = true;

            // Delete the old image after the database update succeeds
            if (existingStudent.profile_image) {
                const oldFilename = path.basename(
                    existingStudent.profile_image
                );

                const oldImagePath = path.join(
                    __dirname,
                    "../../uploads/students",
                    oldFilename
                );

                if (oldFilename && fs.existsSync(oldImagePath)) {
                    fs.unlink(oldImagePath, (error) => {
                        if (error && error.code !== "ENOENT") {
                            console.error(
                                "Failed to remove old profile image:",
                                error
                            );
                        }
                    });
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Student updated successfully.",
            student: {
                student_id: existingStudent.student_id,
                registration_no: registrationNo.trim(),
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim(),
                phone_number: phoneNumber.trim(),
                profile_image: imagePath
            }
        });

    } catch (error) {
        // Remove the new upload if it was not saved to the database
        if (req.file && !newImageSaved) {
            removeUploadedFile(req.file);
        }

        console.error("Update student error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update student."
        });
    }
};
>>>>>>> a3803ff97bc2415108026492f3744f55b3cd4c38
