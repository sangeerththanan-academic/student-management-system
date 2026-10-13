const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.resolve(__dirname, "../../uploads/students");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration with secure random filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Sanitize extension and ensure safe unique filename
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
        cb(null, `student_${uniqueSuffix}${ext}`);
    }
});

// File filter: Only PNG, JPG, and JPEG formats are permitted (CR-010 SEC-003, SEC-004)
const allowedExtensions = [".png", ".jpg", ".jpeg"];
const allowedMimeTypes = ["image/png", "image/jpeg", "image/pjpeg"];

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isExtAllowed = allowedExtensions.includes(ext);
    const isMimeAllowed = allowedMimeTypes.includes(file.mimetype.toLowerCase());

    if (isExtAllowed && isMimeAllowed) {
        cb(null, true);
    } else {
        const error = new Error("Only PNG, JPG and JPEG images are allowed.");
        error.code = "INVALID_FILE_TYPE";
        cb(error, false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

// Middleware wrapper to catch Multer errors and format JSON response consistently
const uploadStudentPhoto = (req, res, next) => {
    const uploadSingle = upload.single("profilePhoto");

    uploadSingle(req, res, (err) => {
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "File size exceeds the 5MB limit."
                });
            }
            if (err.code === "INVALID_FILE_TYPE" || err.message?.includes("Only PNG, JPG and JPEG")) {
                return res.status(400).json({
                    success: false,
                    message: "Only PNG, JPG and JPEG images are allowed."
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message || "File upload failed."
            });
        }
        next();
    });
};

module.exports = {
    uploadStudentPhoto
};
