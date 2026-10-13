
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// CR-010: SERVE STUDENT PROFILE IMAGES
// Images are stored in backend/uploads/students/
// =====================================================

app.use(
    "/uploads/students",
    express.static(
        path.join(__dirname, "../uploads/students")
    )
);

// =====================================================
// HOME ROUTE
// =====================================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Student Management System API is running"
    });
});

// =====================================================
// HEALTH CHECK ROUTE
// =====================================================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API is healthy"
    });
});

// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);

// =====================================================
// 404 HANDLER
// Keep this after all valid routes.
// =====================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
});

// =====================================================
// EXPORT APP
// =====================================================

module.exports = app;
