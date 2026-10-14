require("dotenv").config({
    path: require("path").resolve(__dirname, "../../.env")
});

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "student_management",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function checkConnection() {
    let connection;

    try {
        connection = await pool.getConnection();
        console.log("MySQL database connected");
    } catch (error) {
        console.error("Database connection failed:", error.message);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

checkConnection();

module.exports = pool;
