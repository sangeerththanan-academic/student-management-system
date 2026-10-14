const mysql = require("mysql2/promise");
require("dotenv").config({ path: __dirname + "/../../.env" });

async function runMigration() {
    console.log("Connecting to database...");
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "student_management"
    });

    try {
        console.log("Checking email column in users table...");
        const [cols] = await conn.execute("SHOW COLUMNS FROM users LIKE 'email'");
        if (cols.length === 0) {
            console.log("Adding email column to users table...");
            await conn.execute("ALTER TABLE users ADD COLUMN email VARCHAR(150) NULL UNIQUE AFTER username");
            console.log("email column added.");
        } else {
            console.log("email column already exists.");
        }

        console.log("Backfilling emails from students table...");
        await conn.execute(
            "UPDATE users u JOIN students s ON s.user_id = u.user_id SET u.email = s.email WHERE u.email IS NULL"
        );
        await conn.execute(
            "UPDATE users SET email = 'admin@example.com' WHERE username = 'admin' AND email IS NULL"
        );

        console.log("Creating password_reset_tokens table...");
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token_hash VARCHAR(64) NOT NULL,
                attempts INT NOT NULL DEFAULT 0,
                expires_at DATETIME NOT NULL,
                used_at DATETIME NULL DEFAULT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_reset_token_user
                    FOREIGN KEY (user_id)
                    REFERENCES users(user_id)
                    ON UPDATE CASCADE
                    ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `;
        await conn.execute(createTableSql);

        console.log("Checking schema state...");
        const [userRows] = await conn.execute("SELECT user_id, username, email, role FROM users");
        console.log("Users:", userRows);

        const [tokenCols] = await conn.execute("SHOW COLUMNS FROM password_reset_tokens");
        console.log("password_reset_tokens columns:", tokenCols.map((c) => c.Field));

        console.log("Migration completed successfully!");
    } finally {
        await conn.end();
    }
}

runMigration().catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
});
