
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadDirectory = path.join(
    __dirname,
    "..",
    "uploads",
    "students"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"]
};

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const safeExtension =
            allowedTypes[file.mimetype]?.includes(extension)
                ? extension
                : ".jpg";

        const uniqueName =
            `student-${Date.now()}-${require("crypto").randomBytes(8).toString("hex")}${safeExtension}`;

        callback(null, uniqueName);
    }
});

const multerUpload = multer({
    storage,

    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1
    },

    fileFilter: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const permittedExtensions = allowedTypes[file.mimetype];

        if (
            !permittedExtensions ||
            !permittedExtensions.includes(extension)
        ) {
            const error = new Error(
                "Only PNG, JPG, and JPEG profile images are allowed."
            );
            error.status = 400;
            return callback(error);
        }

        callback(null, true);
    }
}).single("profileImage");

const removeFile = async (filePath) => {
    if (!filePath) return;

    try {
        await fs.promises.unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Unable to remove uploaded image:", error);
        }
    }
};

// Verify the actual file signature rather than trusting the extension/MIME type.
const hasValidImageSignature = async (filePath, mimeType) => {
    const handle = await fs.promises.open(filePath, "r");

    try {
        const buffer = Buffer.alloc(8);
        const { bytesRead } = await handle.read(buffer, 0, 8, 0);

        if (mimeType === "image/png") {
            return (
                bytesRead >= 8 &&
                buffer.subarray(0, 8).equals(
                    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
                )
            );
        }

        if (mimeType === "image/jpeg") {
            return (
                bytesRead >= 3 &&
                buffer[0] === 0xff &&
                buffer[1] === 0xd8 &&
                buffer[2] === 0xff
            );
        }

        return false;
    } finally {
        await handle.close();
    }
};

const uploadStudentProfileImage = (req, res, next) => {
    multerUpload(req, res, async (error) => {
        if (error) {
            const status =
                error.status ||
                (error.code === "LIMIT_FILE_SIZE" ? 400 : 400);

            return res.status(status).json({
                success: false,
                message:
                    error.code === "LIMIT_FILE_SIZE"
                        ? "Profile image must be 2 MB or smaller."
                        : error.message ||
                          "Unable to upload profile image."
            });
        }

        if (!req.file) {
            return next();
        }

        try {
            const validSignature = await hasValidImageSignature(
                req.file.path,
                req.file.mimetype
            );

            if (!validSignature) {
                await removeFile(req.file.path);

                return res.status(400).json({
                    success: false,
                    message:
                        "The selected file is not a valid PNG or JPEG image."
                });
            }

            next();
        } catch (verificationError) {
            await removeFile(req.file.path);

            console.error("Image verification error:", verificationError);

            return res.status(400).json({
                success: false,
                message: "Unable to verify the uploaded image."
            });
        }
    });
};

module.exports = {
    uploadStudentProfileImage,
    removeFile
};