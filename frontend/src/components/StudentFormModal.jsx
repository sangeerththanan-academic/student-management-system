
import { useEffect, useState } from "react";
import apiRequest from "../services/api";

const INITIAL_FORM_DATA = {
    registrationNo: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: ""
};

const MAX_CSV_SIZE = 1024 * 1024;
const MAX_CSV_ROWS = 500;

const REQUIRED_FIELDS = [
    "registrationNo",
    "firstName",
    "lastName",
    "email",
    "phoneNumber"
];

const CSV_HEADER_MAP = {
    registrationno: "registrationNo",
    registrationnumber: "registrationNo",
    registrationnum: "registrationNo",
    firstname: "firstName",
    lastname: "lastName",
    email: "email",
    emailaddress: "email",
    phonenumber: "phoneNumber",
    phone: "phoneNumber",
    password: "password"
};

function normalizeHeader(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");
}

// Parse CSV while supporting quoted commas, escaped quotes,
// Windows line endings and quoted multiline values.
function parseCSV(text) {
    const rows = [];
    let row = [];
    let value = "";
    let inQuotes = false;
    const input = text.replace(/^\uFEFF/, "");

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (inQuotes) {
            if (char === '"') {
                if (input[i + 1] === '"') {
                    value += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                value += char;
            }
        } else if (char === '"' && value.length === 0) {
            inQuotes = true;
        } else if (char === ",") {
            row.push(value);
            value = "";
        } else if (char === "\n" || char === "\r") {
            if (char === "\r" && input[i + 1] === "\n") {
                i++;
            }

            row.push(value);

            if (row.some((cell) => cell.trim() !== "")) {
                rows.push(row);
            }

            row = [];
            value = "";
        } else {
            value += char;
        }
    }

    if (inQuotes) {
        throw new Error("CSV contains an unclosed quotation mark.");
    }

    row.push(value);

    if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
    }

    return rows;
}

function validateValue(name, value, requirePassword = false) {
    const v = String(value ?? "").trim();

    switch (name) {
        case "registrationNo":
            if (!v) return "Registration number is required.";

            if (!/^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/.test(v)) {
                return "Use letters, numbers, hyphens, or underscores.";
            }

            return null;

        case "firstName":
        case "lastName":
            if (!v) return "Name is required.";

            if (v.length < 3) {
                return "Name must contain at least 3 characters.";
            }

            if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(v)) {
                return "Name must contain letters and spaces only.";
            }

            return null;

        case "email":
            if (!v) return "Email address is required.";

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
                return "Please enter a valid email address.";
            }

            return null;

        case "phoneNumber":
            if (!v) return "Phone number is required.";

            if (!/^\d{10}$/.test(v)) {
                return "Phone number must contain exactly 10 digits.";
            }

            return null;

        case "password":
            if (!requirePassword && !v) return null;

            if (!v) return "Password is required.";

            if (value.length < 8) {
                return "Password must be at least 8 characters.";
            }

            if (!/[A-Z]/.test(value)) {
                return "Password must contain an uppercase letter.";
            }

            if (!/[a-z]/.test(value)) {
                return "Password must contain a lowercase letter.";
            }

            if (!/\d/.test(value)) {
                return "Password must contain a number.";
            }

            if (!/[^A-Za-z0-9]/.test(value)) {
                return "Password must contain a special character.";
            }

            return null;

        default:
            return null;
    }
}

function StudentFormModal({
    show,
    editingStudent,
    onClose,
    onSuccess,
    onAuthError
}) {
    const [formData, setFormData] = useState({
        ...INITIAL_FORM_DATA
    });

    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    // CSV state
    const [csvFileName, setCsvFileName] = useState("");
    const [csvError, setCsvError] = useState("");
    const [csvMessage, setCsvMessage] = useState("");
    const [csvStudents, setCsvStudents] = useState([]);
    const [csvResults, setCsvResults] = useState([]);
    const [csvImporting, setCsvImporting] = useState(false);

    useEffect(() => {
        if (!show) return;

        setFormError("");
        setFieldErrors({});
        setTouched({});
        setShowPassword(false);

        setCsvFileName("");
        setCsvError("");
        setCsvMessage("");
        setCsvStudents([]);
        setCsvResults([]);

        if (editingStudent) {
            setFormData({
                registrationNo: editingStudent.registration_no || "",
                firstName: editingStudent.first_name || "",
                lastName: editingStudent.last_name || "",
                email: editingStudent.email || "",
                phoneNumber: String(
                    editingStudent.phone_number ?? ""
                ),
                password: ""
            });
        } else {
            setFormData({ ...INITIAL_FORM_DATA });
        }
    }, [show, editingStudent]);

    const validateField = (name, value) => {
        if (name === "password" && editingStudent) {
            return null;
        }

        return validateValue(name, value, !editingStudent);
    };

    const validateAll = (data = formData) => {
        const fields = [...REQUIRED_FIELDS];

        if (!editingStudent) {
            fields.push("password");
        }

        const errors = {};

        fields.forEach((field) => {
            const error = validateField(field, data[field]);

            if (error) {
                errors[field] = error;
            }
        });

        return errors;
    };

    // ============================================
    // CSV FILE UPLOAD AND PREVIEW
    // ============================================

    const handleCSVUpload = async (event) => {
        const file = event.target.files?.[0];

        // Permit selecting the same file again.
        event.target.value = "";

        setCsvError("");
        setCsvMessage("");
        setCsvFileName("");
        setCsvStudents([]);
        setCsvResults([]);

        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".csv")) {
            setCsvError("Please select a CSV file.");
            return;
        }

        if (!file.size || file.size > MAX_CSV_SIZE) {
            setCsvError("CSV file must be between 1 byte and 1 MB.");
            return;
        }

        try {
            const rows = parseCSV(await file.text());

            if (rows.length < 2) {
                throw new Error(
                    "CSV must contain a header and at least one student."
                );
            }

            if (rows.length - 1 > MAX_CSV_ROWS) {
                throw new Error(
                    `A maximum of ${MAX_CSV_ROWS} student rows is allowed.`
                );
            }

            const headers = rows[0].map(normalizeHeader);

            if (headers.some((header) => !header)) {
                throw new Error("CSV contains an empty column header.");
            }

            const mappedHeaders = headers.map(
                (header) => CSV_HEADER_MAP[header] || null
            );

            const supportedHeaders = mappedHeaders.filter(Boolean);

            if (
                new Set(supportedHeaders).size !==
                supportedHeaders.length
            ) {
                throw new Error(
                    "CSV contains duplicate or ambiguous student columns."
                );
            }

            const requiredHeaders = [
                ...REQUIRED_FIELDS,
                "password"
            ];

            const missingHeaders = requiredHeaders.filter(
                (field) => !supportedHeaders.includes(field)
            );

            if (missingHeaders.length > 0) {
                throw new Error(
                    `Missing required columns: ${missingHeaders.join(", ")}.`
                );
            }

            const validStudents = [];
            const results = [];

            const seenRegistrationNumbers = new Set();
            const seenEmails = new Set();

            for (let i = 1; i < rows.length; i++) {
                const rowNumber = i + 1;
                const values = rows[i];

                if (values.length !== headers.length) {
                    results.push({
                        row: rowNumber,
                        status: "rejected",
                        errors: [
                            "Column count does not match the header."
                        ]
                    });

                    continue;
                }

                const student = {};

                mappedHeaders.forEach((field, index) => {
                    if (field) {
                        student[field] = values[index].trim();
                    }
                });

                const errors = [];

                for (const field of REQUIRED_FIELDS) {
                    const error = validateValue(
                        field,
                        student[field]
                    );

                    if (error) errors.push(error);
                }

                const passwordError = validateValue(
                    "password",
                    student.password,
                    true
                );

                if (passwordError) {
                    errors.push(passwordError);
                }

                const registrationKey =
                    (student.registrationNo || "").toLowerCase();

                const emailKey =
                    (student.email || "").toLowerCase();

                if (
                    registrationKey &&
                    seenRegistrationNumbers.has(registrationKey)
                ) {
                    errors.push(
                        "Duplicate registration number in this CSV."
                    );
                }

                if (emailKey && seenEmails.has(emailKey)) {
                    errors.push("Duplicate email address in this CSV.");
                }

                if (registrationKey) {
                    seenRegistrationNumbers.add(registrationKey);
                }

                if (emailKey) {
                    seenEmails.add(emailKey);
                }

                if (errors.length > 0) {
                    results.push({
                        row: rowNumber,
                        registrationNo: student.registrationNo || "",
                        status: "rejected",
                        errors
                    });
                } else {
                    validStudents.push(student);

                    results.push({
                        row: rowNumber,
                        registrationNo: student.registrationNo,
                        status: "ready",
                        errors: []
                    });
                }
            }

            setCsvFileName(file.name);
            setCsvStudents(validStudents);
            setCsvResults(results);

            setCsvMessage(
                `${validStudents.length} valid records ready to import. ` +
                `${results.length - validStudents.length} rows need correction.`
            );
        } catch (error) {
            setCsvError(error.message || "Unable to read the CSV file.");
        }
    };

    // ============================================
    // BULK CSV IMPORT
    // ============================================

    const handleBulkCSVImport = async () => {
        if (
            !csvStudents.length ||
            csvImporting ||
            formLoading
        ) {
            return;
        }

        setCsvImporting(true);
        setCsvError("");
        setCsvMessage("");

        try {
            const data = await apiRequest(
                "/api/students/import-csv",
                {
                    method: "POST",
                    body: JSON.stringify({
                        students: csvStudents
                    })
                }
            );

            const responseData = data?.data ?? data;

            const serverResults = responseData.results || [];

            // Keep frontend-rejected rows and replace ready rows
            // with the results returned by the backend.
            setCsvResults((previous) => {
                const rejectedRows = previous.filter(
                    (item) => item.status === "rejected"
                );

                return [...rejectedRows, ...serverResults];
            });

            const summary = responseData.summary;

            setCsvMessage(
                summary
                    ? `Import finished: ${summary.imported} imported, ${summary.rejected} rejected.`
                    : responseData.message || "CSV import completed."
            );

            setCsvStudents([]);

            if (typeof onSuccess === "function") {
                await onSuccess();
            }
        } catch (error) {
            if (error.status === 401) {
                onAuthError();
                return;
            }

            if (error.status === 403) {
                setCsvError(
                    "Administrator permission is required to import students."
                );
                return;
            }

            setCsvError(
                error.message || "Failed to import student records."
            );
        } finally {
            setCsvImporting(false);
        }
    };

    const handleClearCSV = () => {
        if (csvImporting || formLoading) return;

        setCsvFileName("");
        setCsvError("");
        setCsvMessage("");
        setCsvStudents([]);
        setCsvResults([]);
    };

    // ============================================
    // FORM INPUT HANDLING
    // ============================================

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        let nextValue = value;

        if (name === "registrationNo") {
            nextValue = value
                .replace(/[^A-Za-z0-9_-]/g, "")
                .slice(0, 30);
        } else if (
            name === "firstName" ||
            name === "lastName"
        ) {
            nextValue = value
                .replace(/[^A-Za-z ]/g, "")
                .slice(0, 50);
        } else if (name === "phoneNumber") {
            if (!/^\d*$/.test(value) || value.length > 10) {
                return;
            }
        }

        setFormData((previous) => ({
            ...previous,
            [name]: nextValue
        }));

        setFormError("");

        if (touched[name]) {
            setFieldErrors((previous) => ({
                ...previous,
                [name]: validateField(name, nextValue)
            }));
        }
    };

    const handleBlur = (event) => {
        const { name, value } = event.target;

        setTouched((previous) => ({
            ...previous,
            [name]: true
        }));

        setFieldErrors((previous) => ({
            ...previous,
            [name]: validateField(name, value)
        }));
    };

    // ============================================
    // SAVE SINGLE STUDENT
    // ============================================

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        const errors = validateAll();
        const fields = [...REQUIRED_FIELDS];

        if (!editingStudent) {
            fields.push("password");
        }

        const allTouched = {};

        fields.forEach((field) => {
            allTouched[field] = true;
        });

        setTouched(allTouched);
        setFieldErrors(errors);

        if (Object.values(errors).some(Boolean)) {
            setFormError(
                "Please correct the highlighted fields before submitting."
            );
            return;
        }

        try {
            setFormLoading(true);

            const studentData = {
                registrationNo: formData.registrationNo.trim(),
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                phoneNumber: formData.phoneNumber.trim()
            };

            if (editingStudent) {
                await apiRequest(
                    `/api/students/${editingStudent.student_id}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(studentData)
                    }
                );
            } else {
                await apiRequest("/api/students/", {
                    method: "POST",
                    body: JSON.stringify({
                        ...studentData,
                        password: formData.password
                    })
                });
            }

            await onSuccess();
            onClose();
        } catch (error) {
            if (error.status === 401) {
                onAuthError();
                return;
            }

            if (error.status === 403) {
                setFormError(
                    "You do not have permission to modify students."
                );
                return;
            }

            if (error.status === 400 && error.data?.errors) {
                setFieldErrors((previous) => ({
                    ...previous,
                    ...error.data.errors
                }));
            }

            setFormError(
                error.message || "Failed to save student."
            );
        } finally {
            setFormLoading(false);
        }
    };

    const handleClose = () => {
        if (formLoading || csvImporting) return;
        onClose();
    };

    // ============================================
    // REUSABLE FORM FIELD
    // ============================================

    const renderField = (
        label,
        name,
        type = "text",
        hint = ""
    ) => {
        const error = touched[name] && fieldErrors[name];
        const hintId = `sf-${name}-hint`;
        const passwordField = name === "password";

        return (
            <div
                key={name}
                className={`form-group${error ? " field-error" : ""}`}
            >
                <label htmlFor={`sf-${name}`}>{label}</label>

                {passwordField ? (
                    <div className="password-input-wrapper">
                        <input
                            id={`sf-${name}`}
                            name={name}
                            type={showPassword ? "text" : "password"}
                            value={formData[name]}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            disabled={formLoading}
                            required={!editingStudent}
                            autoComplete="new-password"
                            aria-invalid={Boolean(error)}
                            aria-describedby={
                                error || hint ? hintId : undefined
                            }
                        />

                        <button
                            type="button"
                            className="password-toggle-button"
                            onClick={() =>
                                setShowPassword((previous) => !previous)
                            }
                            disabled={formLoading}
                            aria-label={
                                showPassword
                                    ? "Hide password"
                                    : "Show password"
                            }
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                ) : (
                    <input
                        id={`sf-${name}`}
                        name={name}
                        type={type}
                        value={formData[name]}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        disabled={formLoading}
                        required
                        autoComplete="off"
                        maxLength={name === "phoneNumber" ? 10 : 254}
                        inputMode={
                            name === "phoneNumber" ? "numeric" : undefined
                        }
                        aria-invalid={Boolean(error)}
                        aria-describedby={
                            error || hint ? hintId : undefined
                        }
                    />
                )}

                {error ? (
                    <span
                        id={hintId}
                        className="field-error-msg"
                        role="alert"
                    >
                        {error}
                    </span>
                ) : hint ? (
                    <span id={hintId} className="field-hint">
                        {hint}
                    </span>
                ) : null}
            </div>
        );
    };

    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div
                className="modal-content student-form-card"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="form-card-header">
                    <div>
                        <h3>
                            {editingStudent
                                ? "Edit Student"
                                : "Add New Student"}
                        </h3>

                        <p>
                            {editingStudent
                                ? "Update student information."
                                : "Create a student or import multiple students from CSV."}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="close-form-button"
                        onClick={handleClose}
                        disabled={formLoading || csvImporting}
                        aria-label="Close form"
                    >
                        ×
                    </button>
                </div>

                {formError && (
                    <div className="dashboard-error" role="alert">
                        {formError}
                    </div>
                )}

                {!editingStudent && (
                    <section className="csv-import-section">
                        <h4>Import Students from CSV</h4>

                        <p>
                            Select a CSV file to preview and import
                            multiple student records.
                        </p>

                        <label htmlFor="student-csv-file">
                            Choose CSV file
                        </label>

                        <input
                            id="student-csv-file"
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleCSVUpload}
                            disabled={formLoading || csvImporting}
                        />

                        <p className="field-hint">
                            Required columns: registration_no,
                            first_name, last_name, email, phone_number,
                            password. Maximum file size: 1 MB.
                        </p>

                        {csvFileName && (
                            <p className="csv-import-filename">
                                Selected file: {csvFileName}
                            </p>
                        )}

                        {csvError && (
                            <p className="csv-import-error" role="alert">
                                {csvError}
                            </p>
                        )}

                        {csvMessage && (
                            <p
                                className="csv-import-success"
                                role="status"
                            >
                                {csvMessage}
                            </p>
                        )}

                        {csvResults.length > 0 && (
                            <div className="csv-results">
                                <h4>Import Preview and Results</h4>

                                {csvResults.map((item, index) => (
                                    <div
                                        key={`${item.row}-${index}`}
                                        className="csv-result-row"
                                    >
                                        <strong>
                                            Row {item.row}
                                            {item.registrationNo
                                                ? ` — ${item.registrationNo}`
                                                : ""}
                                        </strong>

                                        <span>
                                            {" "}{item.status}
                                        </span>

                                        {item.errors?.map(
                                            (message, errorIndex) => (
                                                <p
                                                    key={errorIndex}
                                                    className="csv-import-error"
                                                >
                                                    {message}
                                                </p>
                                            )
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="form-actions">
                            <button
                                type="button"
                                className="save-button"
                                onClick={handleBulkCSVImport}
                                disabled={
                                    !csvStudents.length ||
                                    csvImporting ||
                                    formLoading
                                }
                            >
                                {csvImporting
                                    ? "Importing..."
                                    : `Import ${csvStudents.length} Valid Students`}
                            </button>

                            {csvFileName && (
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={handleClearCSV}
                                    disabled={csvImporting || formLoading}
                                >
                                    Clear CSV
                                </button>
                            )}
                        </div>
                    </section>
                )}

                <form
                    className="student-form"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <h4>
                        {editingStudent
                            ? "Edit Individual Student"
                            : "Add One Student Manually"}
                    </h4>

                    {renderField(
                        "Registration Number",
                        "registrationNo",
                        "text",
                        "Letters, numbers, hyphens, or underscores."
                    )}

                    {renderField(
                        "First Name",
                        "firstName",
                        "text",
                        "At least 3 characters; letters and spaces only."
                    )}

                    {renderField(
                        "Last Name",
                        "lastName",
                        "text",
                        "At least 3 characters; letters and spaces only."
                    )}

                    {renderField(
                        "Email",
                        "email",
                        "email",
                        "Example: student@example.com"
                    )}

                    {renderField(
                        "Phone Number",
                        "phoneNumber",
                        "tel",
                        "Exactly 10 digits."
                    )}

                    {!editingStudent &&
                        renderField(
                            "Password",
                            "password",
                            "password",
                            "At least 8 characters with uppercase, lowercase, number, and special character."
                        )}

                    <div className="form-actions">
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={handleClose}
                            disabled={formLoading || csvImporting}
                        >
                            Close
                        </button>

                        <button
                            type="submit"
                            className="save-button"
                            disabled={formLoading || csvImporting}
                        >
                            {formLoading
                                ? "Saving..."
                                : editingStudent
                                    ? "Update Student"
                                    : "Create Student"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default StudentFormModal;
