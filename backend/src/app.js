
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded student profile images.
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"), {
        dotfiles: "deny",
        index: false,
        fallthrough: true
    })
);

app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Student Management System API is running"
    });
});

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "API is healthy"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
});

// Return JSON for unexpected upload errors.
app.use((err, _req, res, _next) => {
    console.error("API error:", err);

    res.status(err.status || 500).json({
        success: false,
        message:
            err.status && err.status < 500
                ? err.message
                : "Internal server error"
    });
});

module.exports = app;