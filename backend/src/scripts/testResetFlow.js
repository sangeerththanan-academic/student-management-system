const crypto = require("crypto");
require("dotenv").config({ path: __dirname + "/../../.env" });
const pool = require("../config/db");

const {
    findUserByEmail,
    createPasswordResetToken,
    findLatestResetTokenForUser,
    incrementTokenAttempts,
    markPasswordResetTokenUsed,
    deleteUnusedResetTokens
} = require("../models/userModel");

async function resolveTestUser() {
    // 1. Look for any existing user with an email in users or linked students
    const [rows] = await pool.query(
        `SELECT u.user_id, u.username, COALESCE(u.email, s.email) AS email
         FROM users u
         LEFT JOIN students s ON s.user_id = u.user_id
         WHERE (u.email IS NOT NULL AND u.email != '') 
            OR (s.email IS NOT NULL AND s.email != '')
         LIMIT 1`
    );

    if (rows.length > 0 && rows[0].email) {
        return { user: rows[0], isTemporary: false };
    }

    // 2. If no user with email exists, create a temporary user for testing
    console.log("No user with an email found in database. Creating a temporary user for this test...");
    const tempEmail = `test_runner_${Date.now()}@example.com`;
    const tempUsername = `test_runner_${Date.now()}`;
    const [result] = await pool.execute(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES (?, ?, '$2b$10$RmFfhU3ibXGS.CjEFgA.OeDe3ba06x7K4Mx0PF8SArlhYO6Tvihiq', 'STUDENT')`,
        [tempUsername, tempEmail]
    );

    return {
        user: { user_id: result.insertId, username: tempUsername, email: tempEmail },
        isTemporary: true
    };
}

async function testFlow() {
    console.log("=== Testing Backend User Model & OTP Logic ===");

    const { user: testUser, isTemporary } = await resolveTestUser();
    console.log(`Testing with user: ${testUser.email} (ID: ${testUser.user_id}, Username: ${testUser.username})`);

    let createdTokenId = null;

    try {
        // 1. Verify findUserByEmail with the discovered user's email
        const user = await findUserByEmail(testUser.email);
        console.log("Found user via findUserByEmail:", user ? { id: user.user_id, username: user.username, email: user.email } : "Not found");
        if (!user) {
            throw new Error(`User with email ${testUser.email} could not be retrieved by findUserByEmail`);
        }

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
        if (!tokenRecord) {
            throw new Error("Failed to find created reset token!");
        }
        createdTokenId = tokenRecord.id;

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

        console.log("=== All Backend OTP Database Operations Passed! ===");
    } finally {
        // Cleanup test token
        if (createdTokenId) {
            await pool.execute("DELETE FROM password_reset_tokens WHERE id = ?", [createdTokenId]);
            console.log("Cleaned up test reset token.");
        }

        // Cleanup temporary user if one was created
        if (isTemporary) {
            await pool.execute("DELETE FROM users WHERE user_id = ?", [testUser.user_id]);
            console.log("Cleaned up temporary test user.");
        }

        await pool.end();
    }
}

testFlow().catch((err) => {
    console.error("Test error:", err);
    process.exit(1);
});
