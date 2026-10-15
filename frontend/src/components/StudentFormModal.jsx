import { useEffect, useRef, useState } from "react";
import apiRequest from "../services/api";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_CSV_SIZE = 1024 * 1024;

const ALLOWED_TYPES = ["image/png", "image/jpeg"];

const REQUIRED_FIELDS = [
    "registrationNo",
    "firstName",
    "lastName",
    "email",
    "phoneNumber"
];

// Normalize CSV headers to support different naming conventions.
const normalizeHeader = (header) =>
    header
        .replace(/^\uFEFF/, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const HEADER_MAPPING = {
    registrationno: "registrationNo",
    registrationnumber: "registrationNo",
    registration: "registrationNo",
    regno: "registrationNo",

    firstname: "firstName",
    lastname: "lastName",

    email: "email",
    emailaddress: "email",

    phonenumber: "phoneNumber",
    phone: "phoneNumber",
    mobilenumber: "phoneNumber",
    mobile: "phoneNumber"
};

const EMPTY_FORM = {
    registrationNo: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: ""
};

// Remove control characters from text input.
const sanitizeInput = (name, value) =>
    value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

function parseCSV(text) {
    const rows = [];
    let row = [];
    let value = "";
    let insideQuotes = false;
    let quoteClosed = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (insideQuotes) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    value += '"';
                    i++;
                } else {
                    insideQuotes = false;
                    quoteClosed = true;
                }
            } else {
                value += char;
            }

            continue;
        }

        if (char === '"') {
            if (value.length !== 0 || quoteClosed) {
                throw new Error(
                    "Malformed CSV: unexpected quotation mark."
                );
            }

            insideQuotes = true;
        } else if (char === ",") {
            row.push(value);
            value = "";
            quoteClosed = false;
        } else if (char === "\n" || char === "\r") {
            row.push(value);

            if (row.some((cell) => cell.trim() !== "")) {
                rows.push(row);
            }

            row = [];
            value = "";
            quoteClosed = false;

            if (char === "\r" && text[i + 1] === "\n") {
                i++;
            }
        } else {
            if (quoteClosed) {
                if (!/\s/.test(char)) {
                    throw new Error(
                        "Malformed CSV: unexpected text after a quoted value."
                    );
                }
            } else {
                value += char;
            }
        }
    }

    if (insideQuotes) {
        throw new Error(
            "Malformed CSV: a quoted value was not closed."
        );
    }

    row.push(value);

    if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
    }

    return rows;
}

function StudentFormModal({
    show,
    editingStudent,
    onClose,
    onSuccess,
    onAuthError
}) {
    const [formData, setFormData] = useState(EMPTY_FORM);

    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    const [csvError, setCsvError] = useState("");
    const [csvSuccess, setCsvSuccess] = useState("");
    const [csvFileName, setCsvFileName] = useState("");
    const [previousFormData, setPreviousFormData] = useState(null);

    const csvInputRef = useRef(null);

    useEffect(() => {
        if (!show) return;

        if (editingStudent) {
            setFormData({
                registrationNo: editingStudent.registration_no || "",
                firstName: editingStudent.first_name || "",
                lastName: editingStudent.last_name || "",
                email: editingStudent.email || "",
                phoneNumber: editingStudent.phone_number || "",
                password: ""
            });

            setImagePreview(
                editingStudent.profile_photo
                    ? `http://localhost:5000${editingStudent.profile_photo}`
                    : ""
            );
        } else {
            setFormData({ ...EMPTY_FORM });
            setImagePreview("");
        }

        setProfileImage(null);
        setFormError("");
        setFieldErrors({});
        setCsvError("");
        setCsvSuccess("");
        setCsvFileName("");
        setPreviousFormData(null);

        if (csvInputRef.current) {
            csvInputRef.current.value = "";
        }
    }, [editingStudent, show]);

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

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        setProfileImage(null);
        setFormError("");

        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            setFieldErrors((previous) => ({
                ...previous,
                profileImage: "Only PNG and JPEG images are allowed."
            }));
            event.target.value = "";
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setFieldErrors((previous) => ({
                ...previous,
                profileImage: "Profile image must not exceed 2 MB."
            }));
            event.target.value = "";
            return;
        }

        setFieldErrors((previous) => ({
            ...previous,
            profileImage: ""
        }));

        setProfileImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleCSVChange = async (event) => {
        const file = event.target.files?.[0];

        setCsvError("");
        setCsvSuccess("");
        setFormError("");

        if (!file) return;

        const failImport = (message) => {
            setCsvError(message);
            setCsvSuccess("");
            setCsvFileName("");
            setPreviousFormData(null);

            if (csvInputRef.current) {
                csvInputRef.current.value = "";
            }
        };

        if (!file.name.toLowerCase().endsWith(".csv")) {
            failImport("Invalid file type. Please select a .csv file.");
            return;
        }

        if (file.size === 0) {
            failImport("The CSV file is empty.");
            return;
        }

        if (file.size > MAX_CSV_SIZE) {
            failImport("CSV file must not exceed 1 MB.");
            return;
        }

        try {
            const text = await file.text();

            if (!text.trim()) {
                failImport("The CSV file contains no data.");
                return;
            }

            const rows = parseCSV(text);

            if (rows.length < 2) {
                failImport(
                    "The CSV must contain a header row and one student data row."
                );
                return;
            }

            if (rows.length > 2) {
                failImport(
                    "Please upload a CSV containing only one student record. " +
                    "Bulk student import is not supported."
                );
                return;
            }

            const headers = rows[0].map((header) =>
                normalizeHeader(header)
            );

            if (headers.some((header) => !header)) {
                failImport(
                    "The CSV contains an empty column header."
                );
                return;
            }

            const seenHeaders = new Set();

            for (const header of headers) {
                if (seenHeaders.has(header)) {
                    failImport(
                        `Duplicate CSV column header: ${header}`
                    );
                    return;
                }

                seenHeaders.add(header);
            }

            const mappedFields = {};
            const mappedIndexes = new Set();

            for (let i = 0; i < headers.length; i++) {
                const field = HEADER_MAPPING[headers[i]];

                if (!field) continue;

                if (mappedFields[field]) {
                    failImport(
                        `Multiple CSV columns map to ${field}. ` +
                        "Please use only one column for each field."
                    );
                    return;
                }

                mappedFields[field] = headers[i];
                mappedIndexes.add(i);
            }

            const missingColumns = REQUIRED_FIELDS.filter(
                (field) => !mappedFields[field]
            );

            if (missingColumns.length > 0) {
                failImport(
                    "Missing required CSV columns: " +
                    missingColumns.join(", ") +
                    ". Please check the required column headers."
                );
                return;
            }

            const values = rows[1];

            if (values.length !== headers.length) {
                failImport(
                    "The number of CSV values does not match the number of columns."
                );
                return;
            }

            const importedData = {};

            for (const field of REQUIRED_FIELDS) {
                const index = headers.findIndex(
                    (header) => HEADER_MAPPING[header] === field
                );

                importedData[field] = sanitizeInput(
                    field,
                    values[index].trim()
                );
            }

            const missingValues = REQUIRED_FIELDS.filter(
                (field) => !importedData[field]
            );

            if (missingValues.length > 0) {
                failImport(
                    "Missing student information for: " +
                    missingValues.join(", ")
                );
                return;
            }

            // CSV import only populates the form; it never submits it.
            setPreviousFormData({ ...formData });

            setFormData((previous) => ({
                ...previous,
                ...importedData
            }));

            setFieldErrors((previous) => {
                const updated = { ...previous };

                REQUIRED_FIELDS.forEach((field) => {
                    updated[field] = "";
                });

                return updated;
            });

            setCsvFileName(file.name);
            setCsvSuccess(
                "CSV imported successfully. Review and edit the fields before creating the student."
            );
            setCsvError("");
        } catch (error) {
            failImport(
                error.message || "Unable to read the CSV file."
            );
        }
    };

    const handleClearCSV = () => {
        if (previousFormData) {
            setFormData(previousFormData);
        }

        setPreviousFormData(null);
        setCsvFileName("");
        setCsvError("");
        setCsvSuccess("");

        if (csvInputRef.current) {
            csvInputRef.current.value = "";
        }
    };

    const validateForm = () => {
        const errors = {};

        const registrationNo = formData.registrationNo.trim();
        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim();
        const phoneNumber = formData.phoneNumber.trim();
        const password = formData.password;

        if (!registrationNo) {
            errors.registrationNo = "Registration number is required.";
        } else if (!/^[A-Za-z0-9/-]+$/.test(registrationNo)) {
            errors.registrationNo =
                "Registration number can contain only letters, numbers, hyphens, and slashes.";
        }

        if (!firstName) {
            errors.firstName = "First name is required.";
        } else if (firstName.length < 3) {
            errors.firstName =
                "First name must contain at least 3 characters.";
        } else if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(firstName)) {
            errors.firstName =
                "First name can contain only alphabetic characters.";
        }

        if (!lastName) {
            errors.lastName = "Last name is required.";
        } else if (lastName.length < 3) {
            errors.lastName =
                "Last name must contain at least 3 characters.";
        } else if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(lastName)) {
            errors.lastName =
                "Last name can contain only alphabetic characters.";
        }

        if (!email) {
            errors.email = "Email address is required.";
        } else if (
            !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)
        ) {
            errors.email = "Please enter a valid email address.";
        }

        if (!phoneNumber) {
            errors.phoneNumber = "Phone number is required.";
        } else if (!/^\d+$/.test(phoneNumber)) {
            errors.phoneNumber =
                "Phone number must contain numeric characters only.";
        } else if (phoneNumber.length !== 10) {
            errors.phoneNumber =
                "Phone number must contain exactly 10 digits.";
        }

        if (!editingStudent) {
            if (!password) {
                errors.password = "Password is required for a new student.";
            } else if (password.length < 8) {
                errors.password = "Password must contain at least 8 characters.";
            } else if (!/[A-Z]/.test(password)) {
                errors.password = "Password must contain an uppercase letter.";
            } else if (!/[a-z]/.test(password)) {
                errors.password = "Password must contain a lowercase letter.";
            } else if (!/[0-9]/.test(password)) {
                errors.password = "Password must contain a number.";
            } else if (!/[^A-Za-z0-9]/.test(password)) {
                errors.password = "Password must contain a special character.";
            }
        }

        setFieldErrors(errors);

        return Object.keys(errors).length === 0;
    };

    const handleClose = () => {
        if (imagePreview && profileImage) {
            URL.revokeObjectURL(imagePreview);
        }

        setProfileImage(null);
        setImagePreview("");
        setFormError("");
        setFieldErrors({});
        setCsvError("");
        setCsvSuccess("");
        setCsvFileName("");
        setPreviousFormData(null);

        if (csvInputRef.current) {
            csvInputRef.current.value = "";
        }

        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        if (!validateForm()) return;

        try {
            setFormLoading(true);

            if (editingStudent) {
                await apiRequest(
                    `/api/students/${editingStudent.student_id}`,
                    {
                        method: "PUT",
                        body: JSON.stringify({
                            registrationNo: formData.registrationNo.trim(),
                            firstName: formData.firstName.trim(),
                            lastName: formData.lastName.trim(),
                            email: formData.email.trim(),
                            phoneNumber: formData.phoneNumber.trim()
                        })
                    }
                );
            } else {
                const data = new FormData();

                data.append("registrationNo", formData.registrationNo.trim());
                data.append("firstName", formData.firstName.trim());
                data.append("lastName", formData.lastName.trim());
                data.append("email", formData.email.trim());
                data.append("phoneNumber", formData.phoneNumber.trim());
                data.append("password", formData.password);

                if (profileImage) {
                    data.append("profileImage", profileImage);
                }

                await apiRequest("/api/students/", {
                    method: "POST",
                    body: data
                });
            }

            onSuccess();
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

            if (error.data?.errors) {
                setFieldErrors((previous) => ({
                    ...previous,
                    ...error.data.errors
                }));
            }

            setFormError(error.message || "Failed to save student.");
        } finally {
            setFormLoading(false);
        }
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
                            {editingStudent ? "Edit Student" : "Add New Student"}
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
                    <div className="form-group csv-import-section">
                        <label htmlFor="studentCSV">
                            Import Student Details from CSV
                        </label>

                        <input
                            ref={csvInputRef}
                            id="studentCSV"
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleCSVChange}
                            disabled={formLoading}
                        />

                        <small className="form-help">
                            CSV only, maximum 1 MB. Import one student record
                            at a time. Uploading does not create a student.
                        </small>

                        {csvError && (
                            <div className="dashboard-error" role="alert">
                                {csvError}
                            </div>
                        )}

                        {csvSuccess && (
                            <div
                                className="csv-import-success"
                                role="status"
                            >
                                {csvSuccess}
                            </div>
                        )}

                        {csvFileName && (
                            <div className="csv-import-actions">
                                <small>Selected: {csvFileName}</small>

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={handleClearCSV}
                                    disabled={formLoading}
                                >
                                    Clear CSV Import
                                </button>
                            </div>
                        )}

                        <details>
                            <summary>View required CSV format</summary>

                            <p>
                                Use these column headers in the first row.
                                Column order does not matter.
                            </p>

                            <code>
                                registrationNo,firstName,lastName,email,phoneNumber
                            </code>

                            <p>Example data row:</p>

                            <code>
                                REG100,John,Perera,john@example.com,0712345678
                            </code>

                            <p>
                                Password is not imported. Enter it manually
                                below when creating a new student.
                            </p>
                        </details>
                    </div>
                )}

                <form
                    className="student-form"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <div className="form-group">
                        <label>Profile Image (Optional)</label>

                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Profile preview"
                                style={{
                                    width: "100px",
                                    height: "100px",
                                    objectFit: "cover",
                                    borderRadius: "50%",
                                    display: "block",
                                    marginBottom: "10px"
                                }}
                            />
                        )}

                        <input
                            type="file"
                            name="profileImage"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            onChange={handleImageChange}
                            disabled={formLoading}
                        />

                        <small className="form-help">
                            PNG, JPG, or JPEG only. Maximum file size: 2 MB.
                        </small>

                        {fieldErrors.profileImage && (
                            <small className="form-error">
                                {fieldErrors.profileImage}
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Registration Number</label>
                        <input
                            type="text"
                            name="registrationNo"
                            value={formData.registrationNo}
                            onChange={handleInputChange}
                            disabled={formLoading}
                        />
                        {fieldErrors.registrationNo && (
                            <small className="form-error">
                                {fieldErrors.registrationNo}
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            disabled={formLoading}
                        />
                        {fieldErrors.firstName && (
                            <small className="form-error">
                                {fieldErrors.firstName}
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            disabled={formLoading}
                        />
                        {fieldErrors.lastName && (
                            <small className="form-error">
                                {fieldErrors.lastName}
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={formLoading}
                        />
                        {fieldErrors.email && (
                            <small className="form-error">
                                {fieldErrors.email}
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            inputMode="numeric"
                            maxLength={10}
                        />
                        {fieldErrors.phoneNumber && (
                            <small className="form-error">
                                {fieldErrors.phoneNumber}
                            </small>
                        )}
                    </div>

                    {!editingStudent && (
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                disabled={formLoading}
                            />

                            {fieldErrors.password && (
                                <small className="form-error">
                                    {fieldErrors.password}
                                </small>
                            )}

                            <small className="form-help">
                                Minimum 8 characters with uppercase, lowercase,
                                number, and special character.
                            </small>
                        </div>
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
