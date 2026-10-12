
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "../../uploads/students");

// Create upload directory automatically
fs.mkdirSync(uploadDir, { recursive: true });

const allowedExtensions = [".png", ".jpg", ".jpeg"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${extension}`;

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  const isAllowedExtension = allowedExtensions.includes(extension);
  const isAllowedMimeType = ["image/png", "image/jpeg"].includes(mimeType);

  if (!isAllowedExtension || !isAllowedMimeType) {
    const error = new Error(
      "Only PNG, JPG and JPEG images are allowed."
    );

    error.status = 400;
    return cb(error);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // Maximum 2 MB
    files: 1,
  },
});

const uploadSingle = upload.single("profileImage");

const removeUploadedFile = (filePath) => {
    if (filePath) {
        fs.unlink(filePath, () => {});
    }
};

module.exports = (req, res, next) => {
    uploadSingle(req, res, (error) => {
        if (error) {
            const message =
                error.code === "LIMIT_FILE_SIZE"
                    ? "Profile image must be 2 MB or smaller."
                    : error.message || "Invalid profile image.";

            return res.status(400).json({
                success: false,
                message,
            });
        }

        if (!req.file) {
            return next();
        }

        fs.readFile(req.file.path, (readError, buffer) => {
            if (readError) {
                removeUploadedFile(req.file.path);

                return res.status(400).json({
                    success: false,
                    message: "Unable to validate the uploaded profile image.",
                });
            }

            const extension = path
                .extname(req.file.originalname)
                .toLowerCase();

            const isPng =
                buffer.length >= 8 &&
                buffer.subarray(0, 8).equals(
                    Buffer.from([
                        0x89, 0x50, 0x4E, 0x47,
                        0x0D, 0x0A, 0x1A, 0x0A,
                    ])
                );

            const isJpeg =
                buffer.length >= 3 &&
                buffer[0] === 0xFF &&
                buffer[1] === 0xD8 &&
                buffer[2] === 0xFF;

            const validSignature =
                extension === ".png"
                    ? isPng
                    : [".jpg", ".jpeg"].includes(extension) && isJpeg;

            if (!validSignature) {
                removeUploadedFile(req.file.path);

                return res.status(400).json({
                    success: false,
                    message:
                        "The selected file is not a valid PNG, JPG or JPEG image.",
                });
            }

            next();
        });
    });
};