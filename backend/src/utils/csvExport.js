/**
 * CSV Export Utility (CR-015)
 * Handles formatting and escaping student records into CSV structure.
 */

const CSV_HEADERS = [
    "Student ID",
    "Registration Number",
    "First Name",
    "Last Name",
    "Email",
    "Phone Number"
];

/**
 * Escapes an individual field for RFC 4180 compliant CSV output.
 * If field contains commas, double quotes, or newlines, wraps in quotes and escapes internal quotes.
 * Null/undefined are converted to empty strings.
 */
const escapeCsvValue = (value) => {
    if (value === null || value === undefined) {
        return "";
    }
    const stringValue = String(value);
    if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n") ||
        stringValue.includes("\r")
    ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
};

/**
 * Converts an array of student record objects into a standard CSV string.
 * @param {Array<Object>} students 
 * @returns {string} CSV formatted string
 */
const generateStudentsCsv = (students = []) => {
    const headerRow = CSV_HEADERS.join(",");

    if (!Array.isArray(students) || students.length === 0) {
        return headerRow + "\r\n";
    }

    const dataRows = students.map((student) => [
        escapeCsvValue(student.student_id),
        escapeCsvValue(student.registration_no),
        escapeCsvValue(student.first_name),
        escapeCsvValue(student.last_name),
        escapeCsvValue(student.email),
        escapeCsvValue(student.phone_number)
    ].join(","));

    return [headerRow, ...dataRows].join("\r\n") + "\r\n";
};

module.exports = {
    CSV_HEADERS,
    escapeCsvValue,
    generateStudentsCsv
};
