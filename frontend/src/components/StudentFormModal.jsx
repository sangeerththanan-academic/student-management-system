
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

const MAX_CSV_SIZE = 1024 * 1024; // 1 MB

// Parse CSV including quoted commas, escaped quotes and newlines.
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

function normalizeHeader(header) {
    return String(header ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");
}

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

const REQUIRED_CSV_FIELDS = [
    "registrationNo",
    "firstName",
    "lastName",
    "email",
    "phoneNumber"
];

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

    const [csvError, setCsvError] = useState("");
    const [csvMessage, setCsvMessage] = useState("");
    const [csvFileName, setCsvFileName] = useState("");

    useEffect(() => {
        if (!show) return;

        setShowPassword(false);
        setCsvError("");
        setCsvMessage("");
        setCsvFileName("");
        setFormError("");
        setFieldErrors({});
        setTouched({});

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
    }, [editingStudent, show]);

    // Field validation
    const validateField = (name, value) => {
        const v = String(value ?? "").trim();

        switch (name) {
            case "registrationNo":
                if (!v) {
                    return "Registration number is required.";
                }

                if (!/^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/.test(v)) {
                    return "Use letters, numbers, hyphens, or underscores.";
                }

                return null;

            case "firstName":
            case "lastName":
                if (!v) {
                    return `${name === "firstName" ? "First" : "Last"} name is required.`;
                }

                if (v.length < 3) {
                    return "Name must be at least 3 characters.";
                }

                if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(v)) {
                    return "Name must contain letters and spaces only.";
                }

                return null;

            case "email":
                if (!v) {
                    return "Email address is required.";
                }

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
                    return "Please enter a valid email address.";
                }

                return null;

            case "phoneNumber":
                if (!v) {
                    return "Phone number is required.";
                }

                if (!/^\d{10}$/.test(v)) {
                    return "Phone number must contain exactly 10 digits.";
                }

                return null;

            case "password":
                if (editingStudent) return null;

                if (!value) {
                    return "Password is required.";
                }

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
    };

    const validateAll = (data = formData) => {
        const fields = [
            ...REQUIRED_CSV_FIELDS
        ];

        if (!editingStudent) {
            fields.push("password");
        }

        const errors = {};

        fields.forEach((name) => {
            const error = validateField(name, data[name]);

            if (error) {
                errors[name] = error;
            }
        });

        return errors;
    };

    // CSV file upload and form auto-fill
    const handleCSVUpload = async (event) => {
        const file = event.target.files?.[0];

        setCsvError("");
        setCsvMessage("");
        setFormError("");

        if (!file) return;

        // Allow selecting the same file again later.
        event.target.value = "";

        if (!file.name.toLowerCase().endsWith(".csv")) {
            setCsvError("Please select a CSV file.");
            return;
        }

        if (file.size === 0) {
            setCsvError("The selected CSV file is empty.");
            return;
        }

        if (file.size > MAX_CSV_SIZE) {
            setCsvError("CSV file must not exceed 1 MB.");
            return;
        }

        try {
            const text = await file.text();
            const rows = parseCSV(text);

            if (rows.length < 2) {
                setCsvError(
                    "CSV must contain a header row and one student record."
                );
                return;
            }

            const headers = rows[0].map(normalizeHeader);

            if (headers.some((header) => !header)) {
                setCsvError(
                    "CSV contains an empty column header."
                );
                return;
            }

            const mappedHeaders = headers.map(
                (header) => CSV_HEADER_MAP[header] || null
            );

            const supportedHeaders = mappedHeaders.filter(Boolean);

            if (
                new Set(supportedHeaders).size !==
                supportedHeaders.length
            ) {
                setCsvError(
                    "CSV contains duplicate or ambiguous student columns."
                );
                return;
            }

            const missingHeaders = REQUIRED_CSV_FIELDS.filter(
                (field) => !supportedHeaders.includes(field)
            );

            if (missingHeaders.length > 0) {
                setCsvError(
                    `Missing required CSV columns: ${missingHeaders.join(", ")}.`
                );
                return;
            }

            if (rows.length > 2) {
                setCsvError(
                    "This form imports one student at a time. Please use a CSV containing only one student data row."
                );
                return;
            }

            const values = rows[1];

            if (values.length !== headers.length) {
                setCsvError(
                    "CSV row has a different number of values than the header row."
                );
                return;
            }

            const importedData = {
                ...INITIAL_FORM_DATA
            };

            mappedHeaders.forEach((field, index) => {
                if (field) {
                    importedData[field] = values[index].trim();
                }
            });

            const errors = validateAll(importedData);
            const allFieldsTouched = {};

            REQUIRED_CSV_FIELDS.forEach((field) => {
                allFieldsTouched[field] = true;
            });

            if (!editingStudent) {
                allFieldsTouched.password = true;
            }

            setFormData(importedData);
            setTouched(allFieldsTouched);
            setFieldErrors(errors);
            setCsvFileName(file.name);

            if (Object.keys(errors).length > 0) {
                setCsvMessage(
                    "CSV values were imported. Please correct the highlighted fields before saving."
                );
            } else {
                setCsvMessage(
                    "CSV imported successfully. Review the values before creating the student."
                );
            }
        } catch (error) {
            console.error("CSV import error:", error);
            setCsvError(
                error.message || "Unable to read the CSV file."
            );
        }
    };

    const handleClearCSV = () => {
        setFormData({ ...INITIAL_FORM_DATA });
        setFieldErrors({});
        setTouched({});
        setCsvError("");
        setCsvMessage("");
        setCsvFileName("");
        setFormError("");
    };

    // Input change
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        let nextValue = value;

        if (name === "registrationNo") {
            nextValue = value
                .replace(/[^A-Za-z0-9_-]/g, "")
                .slice(0, 30);
        } else if (name === "firstName" || name === "lastName") {
            nextValue = value
                .replace(/[^A-Za-z ]/g, "")
                .slice(0, 30);
        } else if (name === "phoneNumber") {
            if (!/^\d*$/.test(value) || value.length > 10) {
                return;
            }
        }

        const nextData = {
            ...formData,
            [name]: nextValue
        };

        setFormData(nextData);
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

    const handleClose = () => {
        if (formLoading) return;

        setShowPassword(false);
        setCsvError("");
        setCsvMessage("");
        setCsvFileName("");
        setFormError("");
        setFieldErrors({});
        setTouched({});
        onClose();
    };

    // Submit using the existing student creation API
    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        const errors = validateAll();
        const allTouched = {};

        [
            ...REQUIRED_CSV_FIELDS,
            ...(!editingStudent ? ["password"] : [])
        ].forEach((field) => {
            allTouched[field] = true;
        });

        setTouched(allTouched);
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            setFormError(
                "Please fix the highlighted errors before submitting."
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
            handleClose();
        } catch (error) {
            console.error("Student save error:", error);

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

                setFormError(
                    error.message || "Please check the form fields."
                );
                return;
            }

            setFormError(
                error.message || "Failed to save student."
            );
        } finally {
            setFormLoading(false);
        }
    };

    const renderField = (label, name, type = "text", hint = "") => {
        const hasError = Boolean(
            touched[name] && fieldErrors[name]
        );

        const hintId = `sf-${name}-hint`;
        const isPassword = name === "password";

        return (
            <div
                key={name}
                className={`form-group${hasError ? " field-error" : ""}`}
            >
                <label htmlFor={`sf-${name}`}>{label}</label>

                {isPassword ? (
                    <div className="password-input-wrapper">
                        <input
                            id={`sf-${name}`}
                            type={showPassword ? "text" : "password"}
                            name={name}
                            value={formData[name]}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            disabled={formLoading}
                            required={!editingStudent}
                            autoComplete="new-password"
                            aria-describedby={
                                hasError || hint ? hintId : undefined
                            }
                            aria-invalid={hasError}
                        />

                        <button
                            type="button"
                            className="password-toggle-button"
                            onClick={() =>
                                setShowPassword((previous) => !previous)
                            }
                            disabled={formLoading}
                            aria-label={
                                showPassword ? "Hide password" : "Show password"
                            }
                            aria-pressed={showPassword}
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                ) : (
                    <input
                        id={`sf-${name}`}
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        disabled={formLoading}
                        required
                        autoComplete="off"
                        maxLength={
                            name === "phoneNumber"
                                ? 10
                                : name === "email"
                                    ? 254
                                    : 100
                        }
                        inputMode={
                            name === "phoneNumber" ? "numeric" : undefined
                        }
                        aria-describedby={
                            hasError || hint ? hintId : undefined
                        }
                        aria-invalid={hasError}
                    />
                )}

                {hasError ? (
                    <span
                        id={hintId}
                        className="field-error-msg"
                        role="alert"
                    >
                        {fieldErrors[name]}
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
                                : "Create a new student account."}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="close-form-button"
                        onClick={handleClose}
                        disabled={formLoading}
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

                <form
                    className="student-form"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    {!editingStudent && (
                        <section className="csv-import-section">
                            <h4>Import Student Details from CSV</h4>

                            <p>
                                Select a CSV file with one student record.
                                Review and edit the imported values before
                                creating the student.
                            </p>

                            <label htmlFor="student-csv-file">
                                Choose CSV file
                            </label>

                            <input
                                id="student-csv-file"
                                type="file"
                                accept=".csv,text/csv"
                                onChange={handleCSVUpload}
                                disabled={formLoading}
                            />

                            <p className="field-hint">
                                Required columns: registration_no,
                                first_name, last_name, email, phone_number.
                                Password can be entered manually.
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

                            {csvFileName && (
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={handleClearCSV}
                                    disabled={formLoading}
                                >
                                    Clear Imported Data
                                </button>
                            )}
                        </section>
                    )}

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
                        "text",
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
                            disabled={formLoading}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="save-button"
                            disabled={formLoading}
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
