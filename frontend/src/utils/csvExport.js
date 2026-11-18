/**
 * CSV Export Utility (CR-015)
 * Handles client-side CSV formatting, escaping, and download triggers for student records.
 */

export const CSV_HEADERS = [
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
 * @param {*} value
 * @returns {string}
 */
export const escapeCsvValue = (value) => {
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
 * Converts student objects into a CSV-formatted string.
 * @param {Array<Object>} students
 * @returns {string}
 */
export const generateStudentsCsv = (students = []) => {
    const headerRow = CSV_HEADERS.join(",");

    if (!Array.isArray(students) || students.length === 0) {
        return headerRow + "\r\n";
    }

    const dataRows = students.map((student) => [
        escapeCsvValue(student.student_id ?? student.id),
        escapeCsvValue(student.registration_no),
        escapeCsvValue(student.first_name),
        escapeCsvValue(student.last_name),
        escapeCsvValue(student.email),
        escapeCsvValue(student.phone_number)
    ].join(","));

    return [headerRow, ...dataRows].join("\r\n") + "\r\n";
};

/**
 * Triggers a browser download of a given CSV string or Blob.
 * @param {string|Blob} content
 * @param {string} filename
 */
export const triggerCsvDownload = (content, filename = "students.csv") => {
    const blob = content instanceof Blob
        ? content
        : new Blob([content], { type: "text/csv;charset=utf-8;" });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
};
