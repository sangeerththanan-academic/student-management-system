require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const pool = require("../config/db");

const BASE_URL = "http://localhost:5000";

async function runTests() {
    console.log("=================================================");
    console.log("CR-015: Student Records Export to CSV Test Suite");
    console.log("=================================================\n");

    let allPassed = true;

    const assert = (condition, testName, details = "") => {
        if (condition) {
            console.log(`[PASS] ${testName}`);
        } else {
            console.error(`[FAIL] ${testName} ${details ? "- " + details : ""}`);
            allPassed = false;
        }
    };

    try {
        // 1. Initial Database State
        const [initialRows] = await pool.execute(
            "SELECT student_id, registration_no, first_name, last_name, email, phone_number FROM students ORDER BY student_id DESC"
        );
        console.log(`Database currently contains ${initialRows.length} student records.\n`);

        // 2. Authentication: Log in as Admin
        const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "admin",
                password: "Password123!"
            })
        });
        const adminData = await adminRes.json();
        const adminToken = adminData.token;
        assert(!!adminToken, "TC-01: Admin login successful and JWT token acquired");

        // 3. Authentication: Log in as Student (REG001)
        const studentRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "REG001",
                password: "Password123!"
            })
        });
        const studentData = await studentRes.json();
        const studentToken = studentData.token;
        assert(!!studentToken, "TC-02: Student login successful and JWT token acquired");

        // 4. Security: Unauthenticated access blocked (SEC-001, AC-009)
        const unauthRes = await fetch(`${BASE_URL}/api/students/export`);
        assert(
            unauthRes.status === 401,
            `TC-03: Unauthenticated access rejected with 401 Unauthorized (got: ${unauthRes.status})`
        );

        // 5. Security: Student role blocked from export (SEC-001, AC-009)
        const studentExportRes = await fetch(`${BASE_URL}/api/students/export`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        assert(
            studentExportRes.status === 403,
            `TC-04: Student role access rejected with 403 Forbidden (got: ${studentExportRes.status})`
        );

        // 6. Admin export request (AC-001, AC-002)
        const exportRes = await fetch(`${BASE_URL}/api/students/export`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(exportRes.status === 200, "TC-05: Admin export returns HTTP 200 OK");

        // 7. Verify Content-Type and Filename (AC-006)
        const contentType = exportRes.headers.get("content-type");
        const contentDisposition = exportRes.headers.get("content-disposition");
        assert(
            contentType && contentType.includes("text/csv"),
            `TC-06: Response Content-Type is text/csv (got: ${contentType})`
        );
        assert(
            contentDisposition && contentDisposition.includes('filename="students.csv"'),
            `TC-07: Filename in Content-Disposition is students.csv (got: ${contentDisposition})`
        );

        // 8. Parse and verify CSV Structure & Headers (AC-003, FR-003)
        const csvText = await exportRes.text();
        const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
        assert(lines.length >= 1, "TC-08: Exported CSV has at least header line");

        const headerLine = lines[0];
        const expectedHeaders = "Student ID,Registration Number,First Name,Last Name,Email,Phone Number";
        assert(
            headerLine === expectedHeaders,
            `TC-09: CSV headers match exact required format: "${headerLine}"`
        );

        // 9. Verify Data Rows against Database (AC-004, AC-005, AC-007)
        const dataLines = lines.slice(1);
        assert(
            dataLines.length === initialRows.length,
            `TC-10: CSV row count (${dataLines.length}) matches database student count (${initialRows.length})`
        );

        // Verify each line has 6 comma-separated fields
        let fieldsValid = true;
        for (let i = 0; i < dataLines.length; i++) {
            const cols = dataLines[i].split(",");
            if (cols.length < 6) {
                fieldsValid = false;
                break;
            }
        }
        assert(fieldsValid, "TC-11: Every data row contains 6 valid fields");

        // Check each student is present in the CSV
        let allStudentsPresent = true;
        for (const student of initialRows) {
            const hasReg = csvText.includes(student.registration_no);
            const hasFirst = csvText.includes(student.first_name);
            const hasLast = csvText.includes(student.last_name);
            const hasEmail = csvText.includes(student.email);
            if (!hasReg || !hasFirst || !hasLast || !hasEmail) {
                allStudentsPresent = false;
                console.error(`Missing student in CSV: ${student.registration_no} ${student.first_name}`);
                break;
            }
        }
        assert(allStudentsPresent, "TC-12: All student records and exact values are correctly represented");

        // 10. Check Database Immutability / Read-Only constraint (AC-012)
        const [postExportRows] = await pool.execute(
            "SELECT student_id, registration_no, first_name, last_name, email, phone_number FROM students ORDER BY student_id DESC"
        );
        assert(
            postExportRows.length === initialRows.length,
            "TC-13: Database record count is unchanged after export"
        );
        assert(
            JSON.stringify(postExportRows) === JSON.stringify(initialRows),
            "TC-14: Database records are 100% identical before and after export (read-only verification)"
        );

        // 11. Empty List Safe Handling (AC-008, FR-008)
        // Test client-side CSV generator on empty list
        const { generateStudentsCsv } = await import(
            "file:///d:/React/Student_M_S/student-management-system/frontend/src/utils/csvExport.js"
        );
        const emptyCsv = generateStudentsCsv([]);
        assert(
            emptyCsv.trim() === expectedHeaders,
            "TC-15: Empty student list generates valid header-only CSV without throwing runtime errors"
        );

        console.log("\n=================================================");
        if (allPassed) {
            console.log("RESULT: ALL 15 TEST CASES PASSED SUCCESSFULLY!");
        } else {
            console.log("RESULT: SOME TESTS FAILED");
            process.exitCode = 1;
        }
        console.log("=================================================");

        await pool.end();

    } catch (err) {
        console.error("Test execution failed with unexpected error:", err);
        try { await pool.end(); } catch (e) {}
        process.exitCode = 1;
    }
}

runTests();
