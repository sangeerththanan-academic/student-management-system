const mysql = require("mysql2/promise");
require("dotenv").config({ path: __dirname + "/../../.env" });
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const {
    findUserByEmail,
    createPasswordResetToken,
    findLatestResetTokenForUser,
    incrementTokenAttempts,
    markPasswordResetTokenUsed,
    updatePassword,
    deleteUnusedResetTokens
} = require("../models/userModel");

async function testFlow() {
    console.log("=== Testing Backend User Model & OTP Logic ===");

    // 1. Find user by email
    const user = await findUserByEmail("john@example.com");
    console.log("Found user:", user ? { id: user.user_id, username: user.username, email: user.email } : "Not found");
    if (!user) throw new Error("User john@example.com not found");

    // 2. Clean previous unused tokens
    await deleteUnusedResetTokens(user.user_id);

    // 3. Create an OTP
    const testOtp = "123456";
    const tokenHash = crypto.createHash("sha256").update(testOtp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await createPasswordResetToken(user.user_id, tokenHash, expiresAt);
    console.log("Created reset token in DB");

    // 4. Retrieve latest token
    const tokenRecord = await findLatestResetTokenForUser(user.user_id);
    console.log("Retrieved token record:", {
        id: tokenRecord.id,
        user_id: tokenRecord.user_id,
        attempts: tokenRecord.attempts,
        expires_at: tokenRecord.expires_at,
        used_at: tokenRecord.used_at
    });

    if (tokenRecord.token_hash !== tokenHash) {
        throw new Error("Token hash mismatch!");
    }

    // 5. Test increment attempts
    await incrementTokenAttempts(tokenRecord.id);
    const updatedRecord = await findLatestResetTokenForUser(user.user_id);
    console.log("Attempts after 1 wrong try:", updatedRecord.attempts);
    if (updatedRecord.attempts !== 1) {
        throw new Error("Attempts counter didn't increment!");
    }

    // 6. Test mark used
    await markPasswordResetTokenUsed(tokenRecord.id);
    const usedRecord = await findLatestResetTokenForUser(user.user_id);
    console.log("Token used_at after mark used:", usedRecord.used_at);
    if (!usedRecord.used_at) {
        throw new Error("used_at was not updated!");
    }

    // Cleanup
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "student_management"
    });
    await conn.execute("DELETE FROM password_reset_tokens WHERE id = ?", [tokenRecord.id]);
    await conn.end();

    console.log("=== All Backend OTP Database Operations Passed! ===");
}

testFlow().catch((err) => {
    console.error("Test error:", err);
    process.exit(1);
});
