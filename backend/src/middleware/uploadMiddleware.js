
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDirectory = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const allowedExtensions = [".png", ".jpg", ".jpeg"];
const allowedMimeTypes = ["image/png", "image/jpeg"];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const uniqueName =
            `profile-${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`;

        callback(null, uniqueName);
    }
});

const fileFilter = (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
        allowedExtensions.includes(extension) &&
        allowedMimeTypes.includes(file.mimetype)
    ) {
        return callback(null, true);
    }

    const error = new Error(
        "Only PNG, JPG, and JPEG images are allowed."
    );
    error.status = 400;

    return callback(error);
};

const multerUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    }
}).single("profileImage");

// Verify the actual image signature, not just its filename or MIME type.
const isValidImageSignature = (filePath, extension) => {
    const buffer = Buffer.alloc(8);
    const fileDescriptor = fs.openSync(filePath, "r");

    try {
        const bytesRead = fs.readSync(
            fileDescriptor,
            buffer,
            0,
            buffer.length,
            0
        );

        if (extension === ".png") {
            return (
                bytesRead >= 8 &&
                buffer.equals(
                    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
                )
            );
        }

        if (extension === ".jpg" || extension === ".jpeg") {
            return (
                bytesRead >= 3 &&
                buffer[0] === 0xff &&
                buffer[1] === 0xd8 &&
                buffer[2] === 0xff
            );
        }

        return false;
    } finally {
        fs.closeSync(fileDescriptor);
    }
};

const uploadProfileImage = (req, res, next) => {
    multerUpload(req, res, (error) => {
        if (error) {
            const status =
                error.code === "LIMIT_FILE_SIZE" ||
                error.code === "LIMIT_FILE_COUNT" ||
                error.code === "LIMIT_UNEXPECTED_FILE"
                    ? 400
                    : error.status || 400;

            return res.status(status).json({
                success: false,
                message:
                    error.code === "LIMIT_FILE_SIZE"
                        ? "Image size must not exceed 2 MB."
                        : error.code === "LIMIT_UNEXPECTED_FILE"
                            ? "Only one profile image is allowed."
                            : error.message ||
                                "Profile image upload failed."
            });
        }

        if (!req.file) {
            return next();
        }

        try {
            const extension = path.extname(
                req.file.originalname
            ).toLowerCase();

            const validSignature = isValidImageSignature(
                req.file.path,
                extension
            );

            if (!validSignature) {
                fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    success: false,
                    message: "The uploaded file is not a valid PNG or JPEG image."
                });
            }

            return next();
        } catch (verificationError) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            console.error(
                "Profile image verification error:",
                verificationError
            );

            return res.status(500).json({
                success: false,
                message: "Could not verify the uploaded image."
            });
        }
    });
};

module.exports = uploadProfileImage;
