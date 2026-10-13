const crypto = require("crypto");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const uploadDirectory = path.join(
    __dirname,
    "../../uploads/students"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const fileFilter = (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const isPng = extension === ".png" && file.mimetype === "image/png";
    const isJpeg =
        [".jpg", ".jpeg"].includes(extension) &&
        file.mimetype === "image/jpeg";

    if (isPng || isJpeg) {
        return callback(null, true);
    }

    const error = new Error(
        "Only PNG, JPG and JPEG images are allowed."
    );
    error.statusCode = 400;
    return callback(error);
};

const parseUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1
    }
}).single("profileImage");

const hasSupportedImageSignature = (file) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (extension === ".png") {
        return file.buffer
            .subarray(0, 8)
            .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }

    return (
        [".jpg", ".jpeg"].includes(extension) &&
        file.buffer.length >= 3 &&
        file.buffer[0] === 0xff &&
        file.buffer[1] === 0xd8 &&
        file.buffer[2] === 0xff
    );
};

const uploadStudentImage = (req, res, next) => {
    parseUpload(req, res, async (error) => {
        if (error) {
            const statusCode = error.code === "LIMIT_FILE_SIZE"
                ? 413
                : error.statusCode || 400;

            return res.status(statusCode).json({
                success: false,
                message: error.code === "LIMIT_FILE_SIZE"
                    ? "Profile images must be 2 MB or smaller."
                    : error.message
            });
        }

        if (!req.file) {
            return next();
        }

        if (!hasSupportedImageSignature(req.file)) {
            return res.status(400).json({
                success: false,
                message: "The selected file is not a valid PNG, JPG or JPEG image."
            });
        }

        const extension = path.extname(req.file.originalname).toLowerCase();
        const filename = `student-${crypto.randomUUID()}${extension}`;
        const filePath = path.join(uploadDirectory, filename);

        try {
            await fs.promises.writeFile(
                filePath,
                req.file.buffer,
                { flag: "wx" }
            );

            req.file.filename = filename;
            req.file.path = filePath;
            req.file.destination = uploadDirectory;
            delete req.file.buffer;

            return next();
        } catch (writeError) {
            return next(writeError);
        }
    });
};

module.exports = uploadStudentImage;
