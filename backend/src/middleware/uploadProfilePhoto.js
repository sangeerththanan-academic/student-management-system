const fs = require("fs");
const path = require("path");

const multer = require("multer");


// Directory: <project>/backend/uploads/profiles
const PROFILE_DIR = path.join(__dirname, "../../uploads/profiles");

fs.mkdirSync(PROFILE_DIR, { recursive: true });


// Only these server-trusted MIME types are accepted.
// The file extension is derived from this map, never from the client filename.
const MIME_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB


// Keep filenames safe: REG001 stays REG001, "a/b:c" becomes "a_b_c".
const sanitizeRegistrationNo = (value) => {
    if (!value) return "";
    return String(value).trim().replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 50);
};


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, PROFILE_DIR);
    },
    filename: (req, file, cb) => {
        const safeRegNo = sanitizeRegistrationNo(req.body && req.body.registrationNo);
        const ext = MIME_TO_EXT[file.mimetype] || ".jpg";

        // If the text field has not arrived yet, store under a temp name.
        // The controller renames it to <REGNO>.<ext> once validated.
        const base = safeRegNo || `pending-${Date.now()}`;

        // One photo per student: remove sibling files with same base, other ext
        // (e.g. re-uploading REG001.png when REG001.jpg exists).
        if (safeRegNo) {
            try {
                const siblings = fs.readdirSync(PROFILE_DIR);
                for (const name of siblings) {
                    if (name !== `${base}${ext}` && name.startsWith(`${base}.`)) {
                        try {
                            fs.unlinkSync(path.join(PROFILE_DIR, name));
                        } catch (e) {
                            // Best effort cleanup, keep the upload working
                        }
                    }
                }
            } catch (e) {
                // Directory read failed, continue with the upload
            }
        }

        cb(null, `${base}${ext}`);
    }
});


const fileFilter = (req, file, cb) => {
    if (MIME_TO_EXT[file.mimetype]) {
        return cb(null, true);
    }
    const error = new Error("Only JPEG, PNG and WebP images are allowed");
    error.code = "INVALID_FILE_TYPE";
    return cb(error);
};


const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    }
});


// Wrapper so Multer errors keep the existing { success: false } JSON shape.
const uploadProfilePhotoSingle = (req, res, next) => {
    upload.single("profilePhoto")(req, res, (err) => {
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "Profile photo must be 2MB or smaller"
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message || "Invalid profile photo"
            });
        }
        next();
    });
};


module.exports = {
    uploadProfilePhotoSingle,
    sanitizeRegistrationNo,
    PROFILE_DIR,
    MIME_TO_EXT
};
