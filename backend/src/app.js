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
// VALIDATE ROUTER IMPORTS
// =====================================================

if (typeof authRoutes !== "function") {
    throw new TypeError(
        "authRoutes is invalid. Check backend/src/routes/authRoutes.js"
    );
}

if (typeof studentRoutes !== "function") {
    throw new TypeError(
        "studentRoutes is invalid. Check backend/src/routes/studentRoutes.js"
    );
}

// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
    console.error("API Error:", err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        success: false,
        message:
            err.status && err.status < 500
                ? err.message
                : "Internal server error"
    });
});

// =====================================================
// EXPORT APP
// =====================================================

module.exports = app;