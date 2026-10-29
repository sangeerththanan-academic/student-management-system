const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded student profile photos from the same path stored in the DB.
app.use(
    "/Uploads/student",
    express.static(path.join(__dirname, "../Uploads/student"))
);

// Keep existing profile photo links working for images uploaded before this path change.
app.use(
    "/uploads/students",
    express.static(path.join(__dirname, "uploads/students"))
);

// Health check route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Student Management System API is running"
    });
});

// API health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API is healthy"
    });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Student routes
app.use("/api/students", studentRoutes);

// Keep multipart upload errors in the same JSON format as the API responses.
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    const isUploadError = error.name === "MulterError";
    const statusCode = error.status || (isUploadError ? 400 : 500);
    const message = error.code === "LIMIT_FILE_SIZE"
        ? "Image size must not exceed 2 MB."
        : statusCode < 500
            ? error.message || "Request failed."
            : "Internal server error.";

    console.error("API request error:", error);

    return res.status(statusCode).json({
        success: false,
        message
    });
});

// 404 Handler
app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });

});


module.exports = app;
