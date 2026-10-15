<<<<<<< HEAD
=======

>>>>>>> a3803ff97bc2415108026492f3744f55b3cd4c38
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =====================================================
// STUDENT PROFILE IMAGE UPLOAD DIRECTORY
// =====================================================
<<<<<<< HEAD

=======
>>>>>>> a3803ff97bc2415108026492f3744f55b3cd4c38
const uploadDirectory = path.join(
    __dirname,
    "../../uploads/students"
);

<<<<<<< HEAD
// Create directory if it does not exist
=======
// Create upload directory automatically if it doesn't exist.
>>>>>>> a3803ff97bc2415108026492f3744f55b3cd4c38
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// =====================================================
// FILE STORAGE CONFIGURATION
// =====================================================
<<<<<<< HEAD

=======
>>>>>>> a3803ff97bc2415108026492f3744f55b3cd4c38
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        const uniqueFilename =
            `student-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

        callback(null, uniqueFilename);
    }
});

// =====================================================
// ALLOW PNG, JPG AND JPEG ONLY
// =====================================================
<<<<<<< HEAD

=======
>>>>>>> a3803ff97bc2415108026492f3744f55b3cd4c38
const fileFilter = (req, file, callback) => {
    const allowedMimeTypes = [
        "image/png",
        "image/jpeg"
    ];

    const allowedExtensions = [
        ".png",
        ".jpg",
        ".jpeg"
    ];

    const extension = path.extname(file.originalname).toLowerCase();

    if (
        allowedMimeTypes.includes(file.mimetype) &&
        allowedExtensions.includes(extension)
    ) {
        return callback(null, true);
    }

    const error = new Error(
        "Invalid image format. Only PNG, JPG and JPEG files are allowed."
    );

    error.statusCode = 400;

    return callback(error);
};

// =====================================================
<<<<<<< HEAD
// MULTER CONFIGURATION
// Maximum file size: 2 MB
// =====================================================

const uploadStudentImage = multer({
    storage,
    fileFilter,
=======
// MULTER UPLOAD CONFIGURATION
// Maximum image size: 2 MB
// =====================================================
const uploadStudentImage = multer({
    storage,
    fileFilter,

>>>>>>> a3803ff97bc2415108026492f3744f55b3cd4c38
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1
    }
});

<<<<<<< HEAD
// Export the Multer instance.
// Do not add .single() here.
module.exports = uploadStudentImage;
=======
module.exports = uploadStudentImage;
>>>>>>> a3803ff97bc2415108026492f3744f55b3cd4c38
