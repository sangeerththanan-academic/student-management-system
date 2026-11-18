/**
 * CSV Import Utility (CR-022)
 * Robust client-side RFC-4180 CSV parsing, header mapping, validation, and template generation.
 */

export const REQUIRED_FIELDS = [
    { key: "registrationNo", label: "Registration Number" },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phoneNumber", label: "Phone Number" }
];

export const DEFAULT_STUDENT_PASSWORD = "Student@123";

/**
 * Normalizes string for header comparison.
 */
const normalizeHeader = (header = "") => {
    return String(header)
        .toLowerCase()
        .trim()
        .replace(/[\s_-]+/g, "");
};

/**
 * Maps CSV header text to known student form fields.
 */
export const mapHeaderToField = (header = "") => {
    const norm = normalizeHeader(header);

    if (norm === "studentid" || norm === "id") {
        return "studentId";
    }
    if (
        norm === "registrationnumber" ||
        norm === "registrationno" ||
        norm === "regno" ||
        norm === "regnumber" ||
        norm === "registration" ||
        norm === "username"
    ) {
        return "registrationNo";
    }
    if (norm === "firstname" || norm === "fname" || norm === "first") {
        return "firstName";
    }
    if (norm === "lastname" || norm === "lname" || norm === "last" || norm === "surname") {
        return "lastName";
    }
    if (norm === "email" || norm === "emailaddress") {
        return "email";
    }
    if (
        norm === "phonenumber" ||
        norm === "phone" ||
        norm === "mobile" ||
        norm === "mobilenumber" ||
        norm === "contact" ||
        norm === "contactnumber"
    ) {
        return "phoneNumber";
    }
    if (norm === "password") {
        return "password";
    }

    return null;
};

/**
 * Parses RFC 4180 compliant CSV text into a 2D array of strings.
 * Handles CRLF, LF, quotes, escaped quotes (""), and commas inside quotes.
 * Strips UTF-8 BOM if present.
 */
export const parseCsvContent = (csvText = "") => {
    if (!csvText || typeof csvText !== "string") {
        return [];
    }

    // Strip UTF-8 BOM
    let text = csvText.replace(/^\uFEFF/, "");

    const rows = [];
    let currentRow = [];
    let currentField = "";
    let insideQuote = false;
    let i = 0;
    const len = text.length;

    while (i < len) {
        const char = text[i];
        const nextChar = i + 1 < len ? text[i + 1] : "";

        if (insideQuote) {
            if (char === '"') {
                if (nextChar === '"') {
                    // Escaped quote: "" -> "
                    currentField += '"';
                    i += 2;
                    continue;
                } else {
                    // Closing quote
                    insideQuote = false;
                    i++;
                    continue;
                }
            } else {
                currentField += char;
                i++;
                continue;
            }
        } else {
            if (char === '"') {
                insideQuote = true;
                i++;
                continue;
            } else if (char === ",") {
                currentRow.push(currentField);
                currentField = "";
                i++;
                continue;
            } else if (char === "\r") {
                if (nextChar === "\n") {
                    currentRow.push(currentField);
                    rows.push(currentRow);
                    currentRow = [];
                    currentField = "";
                    i += 2;
                    continue;
                } else {
                    currentRow.push(currentField);
                    rows.push(currentRow);
                    currentRow = [];
                    currentField = "";
                    i++;
                    continue;
                }
            } else if (char === "\n") {
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = "";
                i++;
                continue;
            } else {
                currentField += char;
                i++;
                continue;
            }
        }
    }

    // Push trailing field/row if any
    if (currentField !== "" || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }

    // Filter out completely empty trailing lines
    return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
};

/**
 * Validates header row and determines field mapping indices.
 */
export const validateHeaders = (headerRow = []) => {
    const fieldIndexMap = {};
    const detectedHeaders = [];

    headerRow.forEach((colName, index) => {
        const trimmed = String(colName || "").trim();
        const fieldKey = mapHeaderToField(trimmed);
        if (fieldKey) {
            fieldIndexMap[fieldKey] = index;
            detectedHeaders.push({ fieldKey, headerName: trimmed, index });
        }
    });

    const missingFields = REQUIRED_FIELDS.filter(
        (rf) => fieldIndexMap[rf.key] === undefined
    );

    return {
        isValid: missingFields.length === 0,
        fieldIndexMap,
        detectedHeaders,
        missingFields
    };
};

/**
 * Validates a single student record based on CR-004 rules and checks duplicate registrations/emails.
 */
export const validateStudentDataRow = (student, existingStudents = [], batchStudents = []) => {
    const errors = {};

    const regNo = String(student.registrationNo || "").trim();
    const firstName = String(student.firstName || "").trim();
    const lastName = String(student.lastName || "").trim();
    const email = String(student.email || "").trim();
    const phone = String(student.phoneNumber || "").trim();
    const password = String(student.password || "").trim();

    // Registration number validation
    if (!regNo) {
        errors.registrationNo = "Registration number is required.";
    } else if (!/^[A-Za-z0-9_-]+$/.test(regNo)) {
        errors.registrationNo = "Only letters, numbers, hyphens, or underscores allowed.";
    }

    // First name validation
    if (!firstName) {
        errors.firstName = "First name is required.";
    } else if (firstName.length < 3) {
        errors.firstName = "First name must be at least 3 characters.";
    } else if (!/^[A-Za-z\s]+$/.test(firstName)) {
        errors.firstName = "First name must contain letters only.";
    }

    // Last name validation
    if (!lastName) {
        errors.lastName = "Last name is required.";
    } else if (lastName.length < 3) {
        errors.lastName = "Last name must be at least 3 characters.";
    } else if (!/^[A-Za-z\s]+$/.test(lastName)) {
        errors.lastName = "Last name must contain letters only.";
    }

    // Email validation
    if (!email) {
        errors.email = "Email address is required.";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        errors.email = "Enter a valid email address (e.g. user@example.com).";
    }

    // Phone number validation
    if (!phone) {
        errors.phoneNumber = "Phone number is required.";
    } else if (!/^\d+$/.test(phone)) {
        errors.phoneNumber = "Phone number must contain numbers only.";
    } else if (phone.length !== 10) {
        errors.phoneNumber = "Phone number must be exactly 10 digits.";
    }

    // Password validation (if provided)
    if (password) {
        if (password.length < 8) {
            errors.password = "Password must be at least 8 characters.";
        } else if (!/[A-Z]/.test(password)) {
            errors.password = "Password must contain an uppercase letter.";
        } else if (!/[a-z]/.test(password)) {
            errors.password = "Password must contain a lowercase letter.";
        } else if (!/[0-9]/.test(password)) {
            errors.password = "Password must contain a number.";
        } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
            errors.password = "Password must contain a special character.";
        }
    }

    // Check duplicate in already-loaded existing students
    if (regNo) {
        const regLower = regNo.toLowerCase();
        const existsInDB = existingStudents.some(
            (s) => String(s.registration_no || "").toLowerCase() === regLower
        );
        if (existsInDB) {
            errors.registrationNo = `Registration number '${regNo}' already exists in system.`;
        }
    }

    if (email) {
        const emailLower = email.toLowerCase();
        const existsInDB = existingStudents.some(
            (s) => String(s.email || "").toLowerCase() === emailLower
        );
        if (existsInDB) {
            errors.email = `Email '${email}' already exists in system.`;
        }
    }

    // Check duplicate within the batch
    if (regNo) {
        const regLower = regNo.toLowerCase();
        const duplicateInBatch = batchStudents.filter(
            (s) => String(s.registrationNo || "").toLowerCase() === regLower
        );
        if (duplicateInBatch.length > 1) {
            errors.registrationNo = `Duplicate registration number '${regNo}' in file.`;
        }
    }

    if (email) {
        const emailLower = email.toLowerCase();
        const duplicateInBatch = batchStudents.filter(
            (s) => String(s.email || "").toLowerCase() === emailLower
        );
        if (duplicateInBatch.length > 1) {
            errors.email = `Duplicate email '${email}' in file.`;
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        normalizedStudent: {
            registrationNo: regNo,
            firstName,
            lastName,
            email,
            phoneNumber: phone,
            password: password || DEFAULT_STUDENT_PASSWORD
        }
    };
};

/**
 * Generates a ready-to-use sample CSV template for student import.
 */
export const generateSampleCsvTemplate = () => {
    const headers = [
        "Registration Number",
        "First Name",
        "Last Name",
        "Email",
        "Phone Number",
        "Password"
    ];

    const sampleRows = [
        ["REG010", "Michael", "Fernando", "michael.f@example.com", "0711122334", "Student@123"],
        ["REG011", "Amanda", "Perera", "amanda.p@example.com", "0722233445", "Student@123"],
        ["REG012", "Kamal", "Silva", "kamal.s@example.com", "0777788990", "Student@123"]
    ];

    const lines = [
        headers.join(","),
        ...sampleRows.map((row) => row.join(","))
    ];

    return lines.join("\r\n") + "\r\n";
};
