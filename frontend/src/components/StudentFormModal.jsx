import { useEffect, useRef, useState } from "react";
import apiRequest from "../services/api";


// Remove control characters before storing user-entered text.
const sanitizeInput = (_fieldName, value) =>
    Array.from(String(value ?? ""))
        .filter((character) => {
            const code = character.charCodeAt(0);
            return code >= 32 || code === 9 || code === 10 || code === 13;
        })
        .join("");

// Excel removes the leading 0 from phone numbers (0771234567 -> 771234567).
// If a phone number has exactly 9 digits, add the missing leading 0 back.
const fixCsvPhoneNumber = (value) => {
    const phone = String(value ?? "").trim();
    return /^\d{9}$/.test(phone) ? `0${phone}` : phone;
};

// Parse CSV rows, including commas and escaped quotes inside quoted cells.
const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    const source = String(text ?? "").replace(/^\uFEFF/, "");

    for (let i = 0; i < source.length; i += 1) {
        const character = source[i];
        const nextCharacter = source[i + 1];

        if (character === '"') {
            if (inQuotes && nextCharacter === '"') {
                cell += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (character === "," && !inQuotes) {
            row.push(cell.trim());
            cell = "";
        } else if ((character === "\n" || character === "\r") && !inQuotes) {
            if (character === "\r" && nextCharacter === "\n") i += 1;
            row.push(cell.trim());
            if (row.some((value) => value !== "")) rows.push(row);
            row = [];
            cell = "";
        } else {
            cell += character;
        }
    }

    if (inQuotes) {
        throw new Error("The CSV file has an unclosed quotation mark.");
    }

    row.push(cell.trim());
    if (row.some((value) => value !== "")) rows.push(row);

    return rows;
};

const MAX_BULK_STUDENTS = 200;

const normalizeCsvHeader = (header) =>
    String(header ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const getProfileImageUrl = (profileImage) => {
    if (!profileImage) return "";

    if (
        profileImage.startsWith("http://") ||
        profileImage.startsWith("https://")
    ) {
        return profileImage;
    }

    const apiBaseUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:5000"
    ).replace(/\/$/, "");

    if (profileImage.startsWith("/")) {
        return `${apiBaseUrl}${profileImage}`;
    }

    return `${apiBaseUrl}/uploads/students/${profileImage}`;
};

function StudentFormModal({
    show,
    editingStudent,
    onClose,
    onSuccess,
    onAuthError
}) {
    const [formData, setFormData] = useState(() => ({
        registrationNo: editingStudent?.registration_no || "",
        firstName: editingStudent?.first_name || "",
        lastName: editingStudent?.last_name || "",
        email: editingStudent?.email || "",
        phoneNumber: editingStudent?.phone_number || "",
        password: ""
    }));

    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [csvError, setCsvError] = useState("");
    const [csvSuccess, setCsvSuccess] = useState("");
    const [csvLoading, setCsvLoading] = useState(false);
    const csvInputRef = useRef(null);
    const [bulkRows, setBulkRows] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkError, setBulkError] = useState("");
    const [bulkResult, setBulkResult] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(() =>
        editingStudent
            ? getProfileImageUrl(editingStudent.profile_image)
            : ""
    );
    const [imageError, setImageError] = useState("");
    const previewUrlRef = useRef("");

    const updateImagePreview = (preview) => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
        }

        previewUrlRef.current = preview.startsWith("blob:")
            ? preview
            : "";
        setImagePreview(preview);
    };

    useEffect(() => () => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
        }
    }, []);

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: sanitizeInput(name, value)
        }));

        setFieldErrors((previous) => ({
            ...previous,
            [name]: ""
        }));

        setFormError("");
    };

    const handleCsvImport = async (event) => {
        const file = event.target.files?.[0];
        setCsvError("");
        setCsvSuccess("");

        if (!file) return;

        const validCsvType = [
            "text/csv",
            "application/csv",
            "application/vnd.ms-excel",
            "text/plain",
            ""
        ].includes(file.type);
        const hasCsvExtension = file.name.toLowerCase().endsWith(".csv");

        if (!hasCsvExtension || !validCsvType) {
            setCsvError("Please select a valid .csv file.");
            event.target.value = "";
            return;
        }

        if (file.size === 0) {
            setCsvError("The selected CSV file is empty.");
            event.target.value = "";
            return;
        }

        if (file.size > 1024 * 1024) {
            setCsvError("CSV file size must be 1 MB or smaller.");
            event.target.value = "";
            return;
        }

        setCsvLoading(true);

        try {
            const fileText = await file.text();
            const rows = parseCsv(fileText);

            if (rows.length < 2) {
                throw new Error("The CSV must contain a header row and one student data row.");
            }

            const headers = rows[0].map(normalizeCsvHeader);
            const values = rows[1];
            const headerAliases = {
                registrationNo: ["registrationno", "registrationnumber", "regno", "studentid", "studentregistrationno"],
                firstName: ["firstname", "givenname", "studentfirstname"],
                lastName: ["lastname", "surname", "familyname", "studentlastname"],
                email: ["email", "emailaddress", "studentemail"],
                phoneNumber: ["phonenumber", "phone", "mobile", "mobilenumber", "contactnumber"]
            };

            const mappedValues = {};
            const missingColumns = [];

            const columnIndexes = {};

            Object.entries(headerAliases).forEach(([fieldName, aliases]) => {
                const columnIndex = headers.findIndex((header) => aliases.includes(header));
                if (columnIndex === -1) {
                    missingColumns.push(fieldName);
                } else {
                    columnIndexes[fieldName] = columnIndex;
                    mappedValues[fieldName] = sanitizeInput(fieldName, values[columnIndex] ?? "").trim();
                    if (fieldName === "phoneNumber") {
                        mappedValues[fieldName] = fixCsvPhoneNumber(mappedValues[fieldName]);
                    }
                }
            });

            if (missingColumns.length > 0) {
                const labels = {
                    registrationNo: "Registration Number",
                    firstName: "First Name",
                    lastName: "Last Name",
                    email: "Email",
                    phoneNumber: "Phone Number"
                };
                throw new Error(`Missing required CSV column(s): ${missingColumns.map((field) => labels[field]).join(", ")}.`);
            }

            // More than one student row -> bulk import mode.
            if (rows.length > 2) {
                const passwordColumnIndex = headers.findIndex((header) =>
                    ["password", "studentpassword"].includes(header)
                );

                const parsedRows = rows.slice(1).map((rowValues) => {
                    const student = {};

                    Object.keys(columnIndexes).forEach((fieldName) => {
                        student[fieldName] = sanitizeInput(
                            fieldName,
                            rowValues[columnIndexes[fieldName]] ?? ""
                        ).trim();
                    });

                    student.phoneNumber = fixCsvPhoneNumber(student.phoneNumber);

                    student.password =
                        passwordColumnIndex === -1
                            ? ""
                            : String(rowValues[passwordColumnIndex] ?? "");

                    return student;
                });

                if (parsedRows.length > MAX_BULK_STUDENTS) {
                    throw new Error(`You can import a maximum of ${MAX_BULK_STUDENTS} students at a time.`);
                }

                setBulkRows(parsedRows);
                setBulkResult(null);
                setBulkError("");
                setFormError("");
                return;
            }

            const emptyFields = Object.entries(mappedValues)
                .filter(([, value]) => !value)
                .map(([fieldName]) => fieldName);

            if (emptyFields.length > 0) {
                const labels = {
                    registrationNo: "Registration Number",
                    firstName: "First Name",
                    lastName: "Last Name",
                    email: "Email",
                    phoneNumber: "Phone Number"
                };
                throw new Error(`Missing student information for: ${emptyFields.map((field) => labels[field]).join(", ")}.`);
            }

            setFormData((previous) => ({
                ...previous,
                ...mappedValues
            }));
            setFieldErrors((previous) => ({
                ...previous,
                registrationNo: "",
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: ""
            }));
            setFormError("");
            setCsvSuccess("CSV data imported. Review the fields below and enter a password manually.");
        } catch (error) {
            setCsvError(error.message || "Unable to read this CSV file. Check its format and try again.");
        } finally {
            setCsvLoading(false);
            event.target.value = "";
        }
    };

    const cancelBulkImport = () => {
        if (bulkLoading) return;

        setBulkRows(null);
        setBulkError("");
        setBulkResult(null);
        setCsvSuccess("");
    };

    // Download the auto-generated passwords so the admin can share them.
    const downloadCredentials = () => {
        const generated = (bulkResult?.created || []).filter(
            (item) => item.generatedPassword
        );

        const escapeCell = (value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`;

        const csv =
            "\uFEFF" +
            [
                ["registrationNo", "email", "password"],
                ...generated.map((item) => [
                    item.registrationNo,
                    item.email,
                    item.generatedPassword
                ])
            ]
                .map((line) => line.map(escapeCell).join(","))
                .join("\r\n") +
            "\r\n";

        const url = URL.createObjectURL(
            new Blob([csv], { type: "text/csv;charset=utf-8" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = "imported-student-credentials.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const handleBulkImport = async () => {
        setBulkError("");

        try {
            setBulkLoading(true);

            const response = await apiRequest("/api/students/bulk", {
                method: "POST",
                body: JSON.stringify({
                    students: bulkRows
                })
            });

            onSuccess();

            const hasGeneratedPasswords = response.created.some(
                (item) => item.generatedPassword
            );

            if (response.failedCount === 0 && !hasGeneratedPasswords) {
                onClose();
                return;
            }

            // Keep the modal open to show failures and/or generated passwords.
            setBulkResult(response);
        } catch (error) {
            console.error("Bulk import error:", error);

            if (error.status === 401) {
                onAuthError();
                return;
            }

            if (error.status === 403) {
                setBulkError("You do not have permission to modify students.");
                return;
            }

            if (error.data?.failed?.length) {
                setBulkResult(error.data);
                return;
            }

            setBulkError(error.message || "Failed to import students.");
        } finally {
            setBulkLoading(false);
        }
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        setImageError("");
        setFormError("");

        if (!file) {
            setSelectedImage(null);
            updateImagePreview("");
            return;
        }

        const extension = file.name.split(".").pop()?.toLowerCase();
        const validImageType =
            (extension === "png" && file.type === "image/png") ||
            (["jpg", "jpeg"].includes(extension) &&
                file.type === "image/jpeg");

        if (!validImageType) {
            const message = "Only PNG, JPG and JPEG images are allowed.";
            event.target.value = "";
            setSelectedImage(null);
            updateImagePreview("");
            setImageError(message);
            setFormError(message);
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            const message = "Profile images must be 2 MB or smaller.";
            event.target.value = "";
            setSelectedImage(null);
            updateImagePreview("");
            setImageError(message);
            setFormError(message);
            return;
        }

        setSelectedImage(file);
        updateImagePreview(URL.createObjectURL(file));
    };


    const validateForm = () => {
        const errors = {};

        const registrationNo = formData.registrationNo.trim();
        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim();
        const phoneNumber = formData.phoneNumber.trim();
        const password = formData.password;

        // Registration Number Validation
        if (!registrationNo) {
            errors.registrationNo = "Registration number is required.";
        } else if (!/^[A-Za-z0-9/-]+$/.test(registrationNo)) {
            errors.registrationNo =
                "Registration number contains invalid characters.";
        }

        // First Name Validation
        if (!firstName) {
            errors.firstName = "First name is required.";
        } else if (firstName.length < 3) {
            errors.firstName =
                "First name must contain at least 3 characters.";
        } else if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(firstName)) {
            errors.firstName =
                "First name can contain alphabetic characters only.";
        }

        // Last Name Validation
        if (!lastName) {
            errors.lastName = "Last name is required.";
        } else if (lastName.length < 3) {
            errors.lastName =
                "Last name must contain at least 3 characters.";
        } else if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(lastName)) {
            errors.lastName =
                "Last name can contain alphabetic characters only.";
        }

        // Email Validation
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        if (!email) {
            errors.email = "Email address is required.";
        } else if (!emailRegex.test(email)) {
            errors.email =
                "Please enter a valid email address.";
        }

        // Phone Number Validation
        if (!phoneNumber) {
            errors.phoneNumber =
                "Phone number is required.";
        } else if (!/^\d+$/.test(phoneNumber)) {
            errors.phoneNumber =
                "Phone number must contain numeric characters only.";
        } else if (phoneNumber.length < 10) {
            errors.phoneNumber =
                "Phone number must contain exactly 10 digits.";
        } else if (phoneNumber.length > 10) {
            errors.phoneNumber =
                "Phone number must contain exactly 10 digits.";
        }

        // Password Validation
        if (!editingStudent) {

            if (!password) {
                errors.password =
                    "Password is required for a new student.";
            } else if (password.length < 8) {
                errors.password =
                    "Password must contain at least 8 characters.";
            } else if (!/[A-Z]/.test(password)) {
                errors.password =
                    "Password must contain at least one uppercase letter.";
            } else if (!/[a-z]/.test(password)) {
                errors.password =
                    "Password must contain at least one lowercase letter.";
            } else if (!/[0-9]/.test(password)) {
                errors.password =
                    "Password must contain at least one number.";
            } else if (!/[^A-Za-z0-9]/.test(password)) {
                errors.password =
                    "Password must contain at least one special character.";
            }
        }

        setFieldErrors(errors);

        return Object.keys(errors).length === 0;
    };

    const handleClose = () => {
        if (formLoading || bulkLoading) return;

        setFormError("");
        setFieldErrors({});
        setShowPassword(false);
        setSelectedImage(null);
        updateImagePreview("");
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        const isValid = validateForm();

        if (!isValid) {
            setFormError(
                "Please correct the validation errors before submitting."
            );
            return;
        }

        try {
            setFormLoading(true);

            const studentForm = new FormData();
            studentForm.append(
                "registrationNo",
                formData.registrationNo.trim()
            );
            studentForm.append("firstName", formData.firstName.trim());
            studentForm.append("lastName", formData.lastName.trim());
            studentForm.append("email", formData.email.trim());
            studentForm.append("phoneNumber", formData.phoneNumber.trim());

            if (!editingStudent) {
                studentForm.append("password", formData.password);
            }

            if (selectedImage) {
                studentForm.append("profileImage", selectedImage);
            }

            if (editingStudent) {
                await apiRequest(
                    `/api/students/${editingStudent.student_id}`,
                    {
                        method: "PUT",
                        body: studentForm
                    }
                );
            } else {
                await apiRequest(
                    "/api/students/",
                    {
                        method: "POST",
                        body: studentForm
                    }
                );
            }

            onSuccess();
            setFormError("");
            setFieldErrors({});
            setShowPassword(false);
            setSelectedImage(null);
            updateImagePreview("");
            onClose();

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

            setFormError(error.message || "Failed to save student.");
        } finally {
            setFormLoading(false);
        }
    };

    if (!show) return null;


    return (
        <div
            className="modal-overlay"
            onClick={handleClose}
        >

            <div
                className="modal-content student-form-card"
                onClick={(e) => e.stopPropagation()}
            >

                <div className="form-card-header">

                    <div>
                        <h3>
                            {editingStudent
                                ? "Edit Student"
                                : "Add New Student"
                            }
                        </h3>

                        <p>
                            {editingStudent
                                ? "Update student information."
                                : "Create a new student account."
                            }
                        </p>
                    </div>

                    <button
                        type="button"
                        className="close-form-button"
                        onClick={handleClose}
                    >
                        ×
                    </button>

                </div>


                {formError && (
                    <div className="dashboard-error">
                        {formError}
                    </div>
                )}


                {!editingStudent && (
                    <section className="csv-import-panel" aria-label="Import student details from CSV">
                        <div className="csv-import-heading">
                            <div>
                                <h4>Import Student Details (CSV)</h4>
                                <p>Upload a CSV with one student to fill the form, or many students to import them all at once.</p>
                            </div>
                            <span className="csv-import-badge">CSV</span>
                        </div>

                        <label className="csv-file-label" htmlFor="student-csv-file">
                            <span className="csv-upload-icon" aria-hidden="true">↑</span>
                            <span>{csvLoading ? "Reading CSV..." : "Choose CSV file"}</span>
                            <input
                                ref={csvInputRef}
                                id="student-csv-file"
                                type="file"
                                accept=".csv,text/csv"
                                onChange={handleCsvImport}
                                disabled={formLoading || csvLoading || bulkLoading}
                            />
                        </label>

                        <p className="csv-format-hint">
                            Required columns: registrationNo, firstName, lastName, email, phoneNumber.
                            Optional column: password (auto-generated if missing). One row fills the form; several rows are imported in bulk (max 200).
                        </p>

                        {csvError && <p className="csv-message csv-message-error" role="alert">{csvError}</p>}
                        {csvSuccess && <p className="csv-message csv-message-success" role="status">{csvSuccess}</p>}
                    </section>
                )}

                {bulkRows && (
                    <section className="csv-import-panel" aria-label="Bulk student import">
                        <div className="csv-import-heading">
                            <div>
                                <h4>Bulk Import: {bulkRows.length} students found</h4>
                                <p>Review the first rows, then import all students.</p>
                            </div>
                            <span className="csv-import-badge">BULK</span>
                        </div>

                        {!bulkResult && (
                            <>
                                <div style={{ overflowX: "auto", margin: "12px 0" }}>
                                    <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: "left", padding: "4px 6px" }}>Reg. No</th>
                                                <th style={{ textAlign: "left", padding: "4px 6px" }}>Name</th>
                                                <th style={{ textAlign: "left", padding: "4px 6px" }}>Email</th>
                                                <th style={{ textAlign: "left", padding: "4px 6px" }}>Phone</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bulkRows.slice(0, 5).map((row, index) => (
                                                <tr key={`${row.registrationNo}-${index}`}>
                                                    <td style={{ padding: "4px 6px" }}>{row.registrationNo}</td>
                                                    <td style={{ padding: "4px 6px" }}>{row.firstName} {row.lastName}</td>
                                                    <td style={{ padding: "4px 6px" }}>{row.email}</td>
                                                    <td style={{ padding: "4px 6px" }}>{row.phoneNumber}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {bulkRows.length > 5 && (
                                        <p className="csv-format-hint">
                                            ...and {bulkRows.length - 5} more student(s).
                                        </p>
                                    )}
                                </div>

                                <p className="csv-format-hint">
                                    No password needed. Students whose CSV row has no password get a
                                    random secure password automatically. You can download all
                                    passwords after the import.
                                </p>

                                {bulkError && (
                                    <div className="dashboard-error">{bulkError}</div>
                                )}

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="cancel-button"
                                        onClick={cancelBulkImport}
                                        disabled={bulkLoading}
                                    >
                                        Cancel Bulk Import
                                    </button>

                                    <button
                                        type="button"
                                        className="save-button"
                                        onClick={handleBulkImport}
                                        disabled={bulkLoading}
                                    >
                                        {bulkLoading
                                            ? "Importing..."
                                            : `Import ${bulkRows.length} Students`}
                                    </button>
                                </div>
                            </>
                        )}

                        {bulkResult && (
                            <>
                                <p className="csv-message csv-message-success" role="status">
                                    {bulkResult.createdCount} imported, {bulkResult.failedCount} failed.
                                    {bulkResult.created.some((item) => item.generatedPassword) &&
                                        " Download the passwords now - they cannot be viewed again."}
                                </p>

                                {bulkResult.created.some((item) => item.generatedPassword) && (
                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            className="save-button"
                                            onClick={downloadCredentials}
                                        >
                                            Download Passwords (CSV)
                                        </button>
                                    </div>
                                )}

                                <div style={{ maxHeight: "180px", overflowY: "auto", fontSize: "0.85rem" }}>
                                    {bulkResult.failed.map((item) => (
                                        <p
                                            key={`${item.row}-${item.registrationNo}`}
                                            className="csv-message csv-message-error"
                                        >
                                            Row {item.row}
                                            {item.registrationNo ? ` (${item.registrationNo})` : ""}: {item.message}
                                        </p>
                                    ))}
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="save-button"
                                        onClick={handleClose}
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                )}

                {!bulkRows && (
                <form
                    className="student-form"
                    onSubmit={handleSubmit}
                >

                    {/* Registration Number */}

                    <div className="form-group">

                        <label>
                            Registration Number
                        </label>

                        <input
                            type="text"
                            name="registrationNo"
                            value={formData.registrationNo}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                        />

                        {fieldErrors.registrationNo && (
                            <small className="validation-error">
                                {fieldErrors.registrationNo}
                            </small>
                        )}

                    </div>


                    {/* First Name */}

                    <div className="form-group">

                        <label>
                            First Name
                        </label>

                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                        />

                        {fieldErrors.firstName && (
                            <small className="validation-error">
                                {fieldErrors.firstName}
                            </small>
                        )}

                    </div>


                    {/* Last Name */}

                    <div className="form-group">

                        <label>
                            Last Name
                        </label>

                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                        />

                        {fieldErrors.lastName && (
                            <small className="validation-error">
                                {fieldErrors.lastName}
                            </small>
                        )}

                    </div>


                    {/* Email */}

                    <div className="form-group">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                        />

                        {fieldErrors.email && (
                            <small className="validation-error">
                                {fieldErrors.email}
                            </small>
                        )}

                    </div>


                    {/* Phone Number */}

                    <div className="form-group">

                        <label>
                            Phone Number
                        </label>

                        <input
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                            inputMode="numeric"
                            maxLength={10}
                        />

                        {fieldErrors.phoneNumber && (
                            <small className="validation-error">
                                {fieldErrors.phoneNumber}
                            </small>
                        )}

                    </div>

                    <div className="form-group profile-image-field">
                        <label htmlFor="profile-image">
                            Profile Image
                        </label>

                        <input
                            id="profile-image"
                            type="file"
                            name="profileImage"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            onChange={handleImageChange}
                            disabled={formLoading}
                        />

                        <small>
                            Supported formats: PNG, JPG, JPEG. Maximum size: 2 MB.
                        </small>

                        {editingStudent && !selectedImage && imagePreview && (
                            <small>
                                Choose a new image to replace the current profile image.
                            </small>
                        )}

                        {imageError && (
                            <small
                                className="validation-error"
                                role="alert"
                            >
                                {imageError}
                            </small>
                        )}

                        {imagePreview && (
                            <img
                                className="profile-image-preview"
                                src={imagePreview}
                                alt="Student profile preview"
                            />
                        )}
                    </div>


                    {/* Password */}

                    {!editingStudent && (
                        <div className="form-group">

                            <label htmlFor="student-password">
                                Password
                            </label>

                            <div className="password-input-wrapper">

                                <input
                                    id="student-password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    disabled={formLoading}
                                    required
                                    autoComplete="new-password"
                                    aria-describedby="student-password-hint"
                                    aria-invalid={
                                        !!fieldErrors.password
                                    }
                                />

                                <button
                                    type="button"
                                    className="password-toggle-button"
                                    onClick={() =>
                                        setShowPassword(
                                            (previous) => !previous
                                        )
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    aria-pressed={showPassword}
                                    disabled={formLoading}
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </button>

                            </div>

                            {fieldErrors.password && (
                                <small
                                    id="student-password-hint"
                                    className="validation-error"
                                >
                                    {fieldErrors.password}
                                </small>
                            )}

                        </div>
                    )}


                    {/* Form Actions */}

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
                                    : "Create Student"
                            }
                        </button>

                    </div>

                </form>
                )}

            </div>

        </div>
    );
}

export default StudentFormModal;