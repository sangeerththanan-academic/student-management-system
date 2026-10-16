
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

// Serve uploaded student profile images (only image files are accepted by upload middleware).
app.use("/uploads/students", express.static(path.join(__dirname, "../uploads/students"), {
    dotfiles: "deny",
    index: false,
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff")
}));

// Authentication routes
app.use("/api/auth", authRoutes);

// Student routes
app.use("/api/students", studentRoutes);


// Upload/parser errors (including unsupported files and files larger than 5 MB).
app.use((error, req, res, next) => {
    if (error) {
        const status = error.status || (error.code === "LIMIT_FILE_SIZE" ? 400 : 500);
        const message = error.code === "LIMIT_FILE_SIZE"
            ? "Profile image must be 5 MB or smaller."
            : (status === 500 ? "Failed to process uploaded file." : error.message);
        return res.status(status).json({ success: false, message });
    }
    next();
});

// 404 Handler
app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });

});


module.exports = app;

