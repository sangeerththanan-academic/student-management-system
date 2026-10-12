
require("dotenv").config();

const path = require("path");
const express = require("express");
const app = require("./src/app");

// Serve uploaded student profile images.
app.use(
    "/uploads/students",
    express.static(
        path.join(__dirname, "uploads", "students")
    )
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Student Management System API is running on port ${PORT}`
    );
});
