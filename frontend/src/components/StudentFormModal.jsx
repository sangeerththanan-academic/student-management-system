import { useEffect, useRef, useState } from "react";

import apiRequest from "../services/api";

import PasswordInput from "./PasswordInput";

const MAX_CSV_SIZE = 1024 * 1024;
const CSV_FIELDS = {
    registrationno: "registrationNo",
    registrationnumber: "registrationNo",
    firstname: "firstName",
    lastname: "lastName",
    email: "email",
    emailaddress: "email",
    phonenumber: "phoneNumber",
    phone: "phoneNumber"
};
const REQUIRED_CSV_FIELDS = ["registrationNo", "firstName", "lastName", "email", "phoneNumber"];

const parseCsvRow = (line) => {
    const values = [];
    let value = "";
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        if (character === '"') {
            if (quoted && line[index + 1] === '"') {
                value += '"';
                index += 1;
            } else {
                quoted = !quoted;
            }
        } else if (character === "," && !quoted) {
            values.push(value.trim());
            value = "";
        } else {
            value += character;
        }
    }

    if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
    values.push(value.trim());
    return values;
};

const parseStudentCsv = (content) => {
    const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) throw new Error("The CSV must include a header row and one student row.");
    if (lines.length > 2) throw new Error("Upload one student per CSV file. Extra data rows were found.");

    const headers = parseCsvRow(lines[0]).map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (headers.some((header) => !header)) throw new Error("Every CSV column needs a header.");
    const mappedFields = headers.map((header) => CSV_FIELDS[header] || null);
    const supportedFields = mappedFields.filter(Boolean);
    if (new Set(supportedFields).size !== supportedFields.length) {
        throw new Error("The CSV has more than one column mapped to the same student field.");
    }

    const missingFields = REQUIRED_CSV_FIELDS.filter((field) => !supportedFields.includes(field));
    if (missingFields.length) {
        const labels = { registrationNo: "Registration Number", firstName: "First Name", lastName: "Last Name", email: "Email", phoneNumber: "Phone Number" };
        throw new Error(`Missing required CSV columns: ${missingFields.map((field) => labels[field]).join(", ")}.`);
    }

    const values = parseCsvRow(lines[1]);
    if (values.length !== headers.length) throw new Error("The student row does not match the number of CSV columns.");
    const imported = {};
    mappedFields.forEach((field, index) => {
        if (field) imported[field] = values[index];
    });
    return imported;
};

function StudentFormModal({
    show,
    editingStudent,
    onClose,
    onSuccess,
    onAuthError
}) {

    const [formData, setFormData] = useState({
        registrationNo: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: ""
    });

    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [csvError, setCsvError] = useState("");
    const [csvFileName, setCsvFileName] = useState("");
    const csvInputRef = useRef(null);


    // Reset form when editingStudent changes or modal opens
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

        } else {

            setFormData({
                registrationNo: "",
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                password: ""
            });
        }

        setFormError("");
        setFieldErrors({});
        setCsvError("");
        setCsvFileName("");

    }, [editingStudent, show]);


    // ── Validation helpers (CR-004) ─────────────────────────────
    const validateField = (name, value) => {
        const v = (value || "").trim();

        switch (name) {
            case "registrationNo":
                if (!v) return "Registration number is required.";
                if (!/^[A-Za-z0-9_-]+$/.test(v))
                    return "Only letters, numbers, hyphens, or underscores allowed.";
                return null;

            case "firstName":
                if (!v) return "First name is required.";
                if (v.length < 3) return "First name must be at least 3 characters.";
                if (!/^[A-Za-z\s]+$/.test(v)) return "First name must contain letters only.";
                return null;

            case "lastName":
                if (!v) return "Last name is required.";
                if (v.length < 3) return "Last name must be at least 3 characters.";
                if (!/^[A-Za-z\s]+$/.test(v)) return "Last name must contain letters only.";
                return null;

            case "email":
                if (!v) return "Email address is required.";
                if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v))
                    return "Enter a valid email address (e.g. user@example.com).";
                return null;

            case "phoneNumber":
                if (!v) return "Phone number is required.";
                if (!/^\d+$/.test(v)) return "Phone number must contain digits only.";
                if (v.length !== 10) return "Phone number must be exactly 10 digits.";
                return null;

            case "password":
                if (editingStudent) return null;
                if (!value) return "Password is required.";
                if (value.length < 8) return "Password must be at least 8 characters.";
                if (!/[A-Z]/.test(value)) return "Password must include an uppercase letter.";
                if (!/[a-z]/.test(value)) return "Password must include a lowercase letter.";
                if (!/[0-9]/.test(value)) return "Password must include a number.";
                if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(value))
                    return "Password must include a special character.";
                return null;

            default:
                return null;
        }
    };

    const validateAll = () => {
        const fields = ["registrationNo", "firstName", "lastName", "email", "phoneNumber"];
        if (!editingStudent) fields.push("password");

        const errors = {};
        fields.forEach((name) => {
            const err = validateField(name, formData[name]);
            if (err) errors[name] = err;
        });
        return errors;
    };
    // ────────────────────────────────────────────────────────────


    // Handle input changes
    const handleInputChange = (event) => {

        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        // Clear the field-specific error when user edits the field
        setFieldErrors((previous) => ({
            ...previous,
            [name]: ""
        }));

        setFormError("");
    };

    const handleCsvUpload = async (event) => {
        const file = event.target.files?.[0];
        setCsvError("");
        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".csv")) {
            setCsvError("Choose a .csv file.");
            event.target.value = "";
            return;
        }
        if (file.size > MAX_CSV_SIZE) {
            setCsvError("CSV files must be 1 MB or smaller.");
            event.target.value = "";
            return;
        }
        if (file.size === 0) {
            setCsvError("The selected CSV file is empty.");
            event.target.value = "";
            return;
        }

        try {
            const imported = parseStudentCsv(await file.text());
            setFormData((previous) => ({ ...previous, ...imported }));
            setFieldErrors({});
            setFormError("");
            setCsvFileName(file.name);
        } catch (error) {
            setCsvError(error.message || "Could not read this CSV file.");
            setCsvFileName("");
        }
        event.target.value = "";
    };

    const clearCsvImport = () => {
        setFormData({ registrationNo: "", firstName: "", lastName: "", email: "", phoneNumber: "", password: "" });
        setFieldErrors({});
        setFormError("");
        setCsvError("");
        setCsvFileName("");
        if (csvInputRef.current) csvInputRef.current.value = "";
    };


    // Client-side validation
    const validateForm = () => {

        const errors = {};

        const registrationNo = formData.registrationNo.trim();
        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim();
        const phoneNumber = formData.phoneNumber.trim();
        const password = formData.password;


        // Registration number
        if (!registrationNo) {

            errors.registrationNo =
                "Registration number is required.";

        } else if (!/^[A-Za-z0-9-]+$/.test(registrationNo)) {

            errors.registrationNo =
                "Registration number can contain only letters, numbers and hyphens.";
        }


        // First name
        if (!firstName) {

            errors.firstName =
                "First name is required.";

        } else if (firstName.length < 3) {

            errors.firstName =
                "First name must contain at least 3 characters.";

        } else if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(firstName)) {

            errors.firstName =
                "First name contains invalid characters.";
        }


        // Last name
        if (!lastName) {

            errors.lastName =
                "Last name is required.";

        } else if (lastName.length < 3) {

            errors.lastName =
                "Last name must contain at least 3 characters.";

        } else if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(lastName)) {

            errors.lastName =
                "Last name contains invalid characters.";
        }


        // Email
        if (!email) {

            errors.email =
                "Email address is required.";

        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {

            errors.email =
                "Please enter a valid email address.";
        }


        // Phone number
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


        // Password validation is required only when creating
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

            } else if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\]\/';+=~`]/.test(password)) {

                errors.password =
                    "Password must contain at least one special character.";
            }
        }


        setFieldErrors(errors);

        return Object.keys(errors).length === 0;
    };


    const handleClose = () => {

        setFormError("");
        setFieldErrors({});

        onClose();
    };


    const handleSubmit = async (event) => {

        event.preventDefault();

        setFormError("");

        // Stop submission when frontend validation fails
        const isValid = validateForm();

        if (!isValid) {

            setFormError(
                "Please correct the validation errors before submitting."
            );

            return;
        }


        try {

            setFormLoading(true);


            // EDIT STUDENT
            if (editingStudent) {

                await apiRequest(
                    `/api/students/${editingStudent.student_id}`,
                    {
                        method: "PUT",

                        body: JSON.stringify({
                            registrationNo:
                                formData.registrationNo.trim(),

                            firstName:
                                formData.firstName.trim(),

                            lastName:
                                formData.lastName.trim(),

                            email:
                                formData.email.trim(),

                            phoneNumber:
                                formData.phoneNumber.trim()
                        })
                    }
                );

            }

            // CREATE STUDENT
            else {

                await apiRequest(
                    "/api/students/",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            registrationNo:
                                formData.registrationNo.trim(),

                            firstName:
                                formData.firstName.trim(),

                            lastName:
                                formData.lastName.trim(),

                            email:
                                formData.email.trim(),

                            phoneNumber:
                                formData.phoneNumber.trim(),

                            password:
                                formData.password
                        })
                    }
                );
            }


            // Refresh student list
            onSuccess();

            // Close modal
            handleClose();


        } catch (error) {

            console.error(
                "Student save error:",
                error
            );


            // Authentication error
            if (error.status === 401) {

                onAuthError();

                return;
            }


            // Authorization error
            if (error.status === 403) {

                setFormError(
                    "You do not have permission to modify students."
                );

                return;
            }


            // Backend validation error
            if (error.status === 400) {

                setFormError(
                    error.message ||
                    "Please correct the validation errors."
                );

                return;
            }


            // Duplicate data
            if (error.status === 409) {

                setFormError(
                    error.message ||
                    "The registration number or email address is already registered."
                );

                return;
            }


            // Other errors
            setFormError(
                error.message ||
                "Failed to save student."
            );

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
                        disabled={formLoading}
                    >
                        ×
                    </button>

                </div>


                {formError && (
                    <div
                        className="dashboard-error"
                        role="alert"
                    >
                        {formError}
                    </div>
                )}


                <form
                    className="student-form"
                    onSubmit={handleSubmit}
                    noValidate
                >

                    {!editingStudent && (
                        <section className="student-csv-import" aria-label="Import student details from CSV">
                            <label htmlFor="student-csv-file">Populate from CSV (optional)</label>
                            <input
                                ref={csvInputRef}
                                id="student-csv-file"
                                type="file"
                                accept=".csv,text/csv"
                                onChange={handleCsvUpload}
                                disabled={formLoading}
                            />
                            <small>One student per file. Required headers: Registration Number, First Name, Last Name, Email, Phone Number. Enter the password manually.</small>
                            {csvFileName && <span className="student-csv-status" role="status">Loaded {csvFileName}. Review and edit the fields below.</span>}
                            {csvError && <span className="student-csv-error" role="alert">{csvError}</span>}
                            {csvFileName && <button type="button" className="students-search-clear" onClick={clearCsvImport} disabled={formLoading}>Clear imported values</button>}
                        </section>
                    )}

                    {/* Registration Number */}
                    <div className="form-group">

                        <label htmlFor="registrationNo">
                            Registration Number
                        </label>

                        <input
                            id="registrationNo"
                            type="text"
                            name="registrationNo"
                            value={formData.registrationNo}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            aria-invalid={
                                Boolean(fieldErrors.registrationNo)
                            }
                        />

                        {fieldErrors.registrationNo && (
                            <small className="field-error">
                                {fieldErrors.registrationNo}
                            </small>
                        )}

                    </div>


                    {/* First Name */}
                    <div className="form-group">

                        <label htmlFor="firstName">
                            First Name
                        </label>

                        <input
                            id="firstName"
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            aria-invalid={
                                Boolean(fieldErrors.firstName)
                            }
                        />

                        {fieldErrors.firstName && (
                            <small className="field-error">
                                {fieldErrors.firstName}
                            </small>
                        )}

                    </div>


                    {/* Last Name */}
                    <div className="form-group">

                        <label htmlFor="lastName">
                            Last Name
                        </label>

                        <input
                            id="lastName"
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            aria-invalid={
                                Boolean(fieldErrors.lastName)
                            }
                        />

                        {fieldErrors.lastName && (
                            <small className="field-error">
                                {fieldErrors.lastName}
                            </small>
                        )}

                    </div>


                    {/* Email */}
                    <div className="form-group">

                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            aria-invalid={
                                Boolean(fieldErrors.email)
                            }
                        />

                        {fieldErrors.email && (
                            <small className="field-error">
                                {fieldErrors.email}
                            </small>
                        )}

                    </div>


                    {/* Phone */}
                    <div className="form-group">

                        <label htmlFor="phoneNumber">
                            Phone Number
                        </label>

                        <input
                            id="phoneNumber"
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            inputMode="numeric"
                            maxLength="20"
                            aria-invalid={
                                Boolean(fieldErrors.phoneNumber)
                            }
                        />

                        {fieldErrors.phoneNumber && (
                            <small className="field-error">
                                {fieldErrors.phoneNumber}
                            </small>
                        )}

                    </div>



                    {/* Password - CREATE ONLY */}
                    {!editingStudent && (
                        <div className="form-group">

                            <label htmlFor="password">
                                Password
                            </label>

                            <PasswordInput
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                disabled={formLoading}
                                required
                                autoComplete="new-password"
                                invalid={Boolean(fieldErrors.password)}
                            />

                            {fieldErrors.password && (
                                <small className="field-error">
                                    {fieldErrors.password}
                                </small>
                            )}

                        </div>
                    )}


                    {/* Buttons */}
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

            </div>

        </div>
    );
}

export default StudentFormModal;
