/**
 * CR-015: Student Records Export to CSV
 * Utility module for generating and downloading RFC 4180 compliant CSV files.
 */

/**
 * Escapes a single CSV cell value according to RFC 4180 standards.
 * Wraps values with quotes if they contain commas, double quotes, or newlines,
 * and doubles any internal double quotes.
 *
 * @param {unknown} value - Value to format
 * @returns {string} - Escaped CSV cell string
 */
export const formatCsvCell = (value) => {
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
 * Generates an RFC 4180 compliant CSV string from an array of student objects.
 * Required columns (FR-003, FR-004, AC-003, AC-004):
 * Student ID, Registration Number, First Name, Last Name, Email, Phone Number
 *
 * @param {Array<Object>} students - Array of student records
 * @returns {string} - CSV formatted string
 */
export const generateStudentsCsv = (students = []) => {
    const headers = [
        "Student ID",
        "Registration Number",
        "First Name",
        "Last Name",
        "Email",
        "Phone Number"
    ];

    const lines = [headers.join(",")];

    if (Array.isArray(students)) {
        for (const student of students) {
            const row = [
                formatCsvCell(student.student_id),
                formatCsvCell(student.registration_no),
                formatCsvCell(student.first_name),
                formatCsvCell(student.last_name),
                formatCsvCell(student.email),
                formatCsvCell(student.phone_number)
            ];
            lines.push(row.join(","));
        }
    }

    return lines.join("\r\n");
};

/**
 * Triggers a browser download of the generated CSV file.
 *
 * @param {string} csvContent - CSV string
 * @param {string} filename - Target filename (defaults to 'students.csv')
 */
export const downloadCsvFile = (csvContent, filename = "students.csv") => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        if (link.parentNode) {
            document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
    }, 500);
};

/**
 * High-level helper to export student records directly to CSV.
 * Safely handles empty student lists without error (FR-008, AC-008).
 *
 * @param {Array<Object>} students - Array of student records
 * @param {string} [filename='students.csv'] - Meaningful CSV filename (FR-006, AC-006)
 * @returns {{ count: number, filename: string }}
 */
export const exportStudentsToCsv = (students = [], filename = "students.csv") => {
    const csvContent = generateStudentsCsv(students);
    downloadCsvFile(csvContent, filename);
    return {
        count: Array.isArray(students) ? students.length : 0,
        filename
    };
};
