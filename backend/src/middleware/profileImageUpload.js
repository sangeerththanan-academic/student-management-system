const multer = require("multer");
const path = require("path");

const allowedTypes = new Map([
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"]
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        if (allowedTypes.get(extension) !== file.mimetype) {
            callback(new Error("Profile image must be a PNG, JPG, or JPEG file."));
            return;
        }

        callback(null, true);
    }
});

const hasValidImageSignature = (file) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (extension === ".png") {
        return file.buffer.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        );
    }

    return file.buffer[0] === 0xff &&
        file.buffer[1] === 0xd8 &&
        file.buffer[2] === 0xff;
};

const uploadProfileImage = (req, res, next) => {
    upload.single("profileImage")(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.code === "LIMIT_FILE_SIZE"
                    ? "Profile image must be 10 MB or smaller."
                    : error.message
            });
        }

        if (req.file && !hasValidImageSignature(req.file)) {
            return res.status(400).json({
                success: false,
                message: "The uploaded file contents do not match a PNG, JPG, or JPEG image."
            });
        }

        next();
    });
};

module.exports = uploadProfileImage;