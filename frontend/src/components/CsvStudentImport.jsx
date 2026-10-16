import { useRef, useState } from "react";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

const HEADER_ALIASES = {
    registrationNo: [
        "registration_no",
        "registration number",
        "registrationno",
        "registration_no.",
        "registration"
    ],
    firstName: [
        "first_name",
        "first name",
        "firstname"
    ],
    lastName: [
        "last_name",
        "last name",
        "lastname"
    ],
    email: [
        "email",
        "email_address",
        "email address"
    ],
    phoneNumber: [
        "phone_number",
        "phone number",
        "phonenumber",
        "phone",
        "mobile"
    ]
};

function normalizeHeader(value) {
    return String(value ?? "")
        .replace(/^\uFEFF/, "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");
}

function parseCsv(text) {
    const rows = [];
    let row = [];
    let value = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const character = text[i];

        if (character === '"') {
            if (insideQuotes && text[i + 1] === '"') {
                value += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (character === "," && !insideQuotes) {
            row.push(value);
            value = "";
        } else if (
            (character === "\n" || character === "\r") &&
            !insideQuotes
        ) {
            if (character === "\r" && text[i + 1] === "\n") {
                i++;
            }

            row.push(value);

            if (row.some((cell) => cell.trim() !== "")) {
                rows.push(row);
            }

            row = [];
            value = "";
        } else {
            value += character;
        }
    }

    if (insideQuotes) {
        throw new Error(
            "CSV contains an unclosed quotation mark. Please check the file."
        );
    }

    row.push(value);

    if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
    }

    return rows;
}

function findColumnIndex(headers, aliases) {
    const normalizedAliases = aliases.map(normalizeHeader);

    return headers.findIndex((header) =>
        normalizedAliases.includes(normalizeHeader(header))
    );
}

export default function CsvStudentImport({ onImport }) {
    const fileInputRef = useRef(null);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    function showMessage(text, type = "error") {
        setMessage(text);
        setMessageType(type);
    }

    function resetFile() {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setMessage("");
        setMessageType("");
    }

    function handleFileChange(event) {
        const file = event.target.files?.[0];

        setMessage("");
        setMessageType("");

        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".csv")) {
            showMessage("Please select a CSV file (.csv).");
            event.target.value = "";
            return;
        }

        if (file.size === 0) {
            showMessage("The selected CSV file is empty.");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            showMessage("File size must not exceed 2 MB.");
            event.target.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            try {
                const text = String(reader.result ?? "");

                const rows = parseCsv(text);

                if (rows.length < 2) {
                    throw new Error(
                        "CSV must contain a header row and one student data row."
                    );
                }

                if (rows.length > 2) {
                    throw new Error(
                        "This form imports one student per CSV file. " +
                        "Please use a file containing only one student data row."
                    );
                }

                const headers = rows[0];
                const values = rows[1];

                const fieldIndexes = {};

                for (const [field, aliases] of Object.entries(
                    HEADER_ALIASES
                )) {
                    fieldIndexes[field] = findColumnIndex(
                        headers,
                        aliases
                    );
                }

                const requiredFields = [
                    ["registrationNo", "Registration Number"],
                    ["firstName", "First Name"],
                    ["lastName", "Last Name"],
                    ["email", "Email"],
                    ["phoneNumber", "Phone Number"]
                ];

                const missingHeaders = requiredFields
                    .filter(([field]) => fieldIndexes[field] === -1)
                    .map(([, label]) => label);

                if (missingHeaders.length > 0) {
                    throw new Error(
                        "Missing required CSV columns: " +
                        missingHeaders.join(", ")
                    );
                }

                const importedData = {};

                for (const [field, index] of Object.entries(
                    fieldIndexes
                )) {
                    if (index !== -1) {
                        importedData[field] = String(
                            values[index] ?? ""
                        ).trim();
                    }
                }

                const emptyFields = requiredFields
                    .filter(([field]) => !importedData[field])
                    .map(([, label]) => label);

                if (emptyFields.length > 0) {
                    throw new Error(
                        "Missing student values for: " +
                        emptyFields.join(", ")
                    );
                }

                onImport(importedData);

                showMessage(
                    "CSV imported successfully. Review and validate the form before saving.",
                    "success"
                );
            } catch (error) {
                showMessage(
                    error.message || "Unable to read the CSV file."
                );
            }
        };

        reader.onerror = () => {
            showMessage("Unable to read the selected file.");
        };

        reader.readAsText(file, "UTF-8");
    }

    return (
        <div className="csv-student-import">
            <label
                className="csv-import-label"
                htmlFor="student-csv-file"
            >
                Import student details from CSV
            </label>

            <p className="csv-import-help">
                Select a CSV file with a header row and one student's
                information. Maximum file size: 2 MB.
            </p>

            <div className="csv-import-controls">
                <input
                    ref={fileInputRef}
                    id="student-csv-file"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                />

                <button
                    type="button"
                    className="csv-import-clear"
                    onClick={resetFile}
                >
                    Clear CSV
                </button>
            </div>

            {message && (
                <p
                    className={`csv-import-message ${messageType}`}
                    role="status"
                    aria-live="polite"
                >
                    {message}
                </p>
            )}
        </div>
    );
}
