
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDirectory = path.join(
    __dirname,
    "../../Uploads/student"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const safeName = `${Date.now()}-${crypto.randomUUID()}${extension}`;

        callback(null, safeName);
    }
});

const allowedExtensions = [".png", ".jpg", ".jpeg"];
const allowedMimeTypes = ["image/png", "image/jpeg"];

const fileFilter = (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
        !allowedExtensions.includes(extension) ||
        !allowedMimeTypes.includes(file.mimetype)
    ) {
        const error = new Error(
            "Only PNG, JPG and JPEG images are allowed."
        );

        error.status = 400;
        return callback(error);
    }

    callback(null, true);
};

const uploadStudentImage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1
    }
});

module.exports = { uploadStudentImage };
