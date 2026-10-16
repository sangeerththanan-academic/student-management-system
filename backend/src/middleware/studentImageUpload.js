const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const uploadDirectory = path.join(__dirname, "../../uploads/students");
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedExtensions = new Set([".png", ".jpg", ".jpeg"]);
const allowedMimeTypes = new Set(["image/png", "image/jpeg"]);

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(null, `${crypto.randomUUID()}${extension}`);
    }
});

const uploadStudentImage = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
            const error = new Error("Only PNG, JPG and JPEG images are allowed.");
            error.status = 400;
            return callback(error);
        }
        callback(null, true);
    }
}).single("profileImage");

const handleStudentImageUpload = (req, res, next) => {
    uploadStudentImage(req, res, async (error) => {
        if (error) return next(error);
        if (!req.file) return next();

        try {
            const handle = await fs.promises.open(req.file.path, "r");
            const header = Buffer.alloc(8);
            const { bytesRead } = await handle.read(header, 0, 8, 0);
            await handle.close();

            const isPng = bytesRead >= 8 &&
                header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
            const isJpeg = bytesRead >= 3 &&
                header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;
            const extension = path.extname(req.file.originalname).toLowerCase();
            const valid = (extension === ".png" && isPng) ||
                ((extension === ".jpg" || extension === ".jpeg") && isJpeg);

            if (!valid) {
                await fs.promises.unlink(req.file.path).catch(() => {});
                const invalidImage = new Error("The selected file is not a valid PNG, JPG or JPEG image.");
                invalidImage.status = 400;
                return next(invalidImage);
            }
            next();
        } catch (validationError) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            next(validationError);
        }
    });
};

module.exports = {
    uploadStudentImage: handleStudentImageUpload,
    uploadDirectory
};

