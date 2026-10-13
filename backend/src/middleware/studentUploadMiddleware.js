const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =====================================================
// STUDENT PROFILE IMAGE UPLOAD DIRECTORY
// =====================================================

const uploadDirectory = path.join(
    __dirname,
    "../../uploads/students"
);

// Create directory if it does not exist
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// =====================================================
// FILE STORAGE CONFIGURATION
// =====================================================

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
// MULTER CONFIGURATION
// Maximum file size: 2 MB
// =====================================================

const uploadStudentImage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1
    }
});

// Export the Multer instance.
// Do not add .single() here.
module.exports = uploadStudentImage;