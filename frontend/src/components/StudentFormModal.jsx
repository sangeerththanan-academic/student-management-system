import { Fragment, useEffect, useState } from "react";
import apiRequest from "../services/api";
import { parseStudentCsv } from "../utils/studentCsv";

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
    const [showPassword, setShowPassword] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [profileImageError, setProfileImageError] = useState("");
    const [csvImportError, setCsvImportError] = useState("");
    const [batchRows, setBatchRows] = useState([]);

    // Validation states
    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});

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
        setTouched({});
        setShowPassword(false);
        setProfileImage(null);
        setProfileImageError("");
        setCsvImportError("");
        setBatchRows([]);
    }, [editingStudent, show]);

    const handleCsvFileChange = async (event) => {
        const input = event.currentTarget;
        const file = input.files?.[0];
        setCsvImportError("");

        if (!file) {
            return;
        }

        const allowedMimeTypes = [
            "",
            "text/csv",
            "application/csv",
            "application/vnd.ms-excel",
            "application/octet-stream",
            "text/plain"
        ];

        if (
            !file.name.toLowerCase().endsWith(".csv") ||
            !allowedMimeTypes.includes(file.type.toLowerCase())
        ) {
            setCsvImportError("Select a valid .csv file.");
            input.value = "";
            return;
        }

        try {
            const parsedRows = parseStudentCsv(await file.text()).map((data, index) => ({
                id: index,
                data,
                profileImage: null,
                imageError: "",
                status: "pending",
                error: ""
            }));

            setFormError("");
            setBatchRows(parsedRows);
        } catch (error) {
            setCsvImportError(
                error.message || "The CSV file could not be read. Check its format and try again."
            );
        } finally {
            input.value = "";
        }
    };

    const handleBatchFieldChange = (rowId, field, value) => {
        setBatchRows((previous) => previous.map((row) => (
            row.id === rowId
                ? {
                    ...row,
                    data: { ...row.data, [field]: value },
                    status: row.status === "created" ? "created" : "pending",
                    error: ""
                }
                : row
        )));
    };

    const handleBatchProfileImageChange = (rowId, event) => {
        const input = event.currentTarget;
        const file = input.files?.[0] || null;
        let imageError = "";

        if (file) {
            const extension = file.name.split(".").pop()?.toLowerCase();
            const allowedExtensions = ["png", "jpg", "jpeg"];
            const allowedMimeTypes = ["image/png", "image/jpeg"];

            if (
                !allowedExtensions.includes(extension) ||
                !allowedMimeTypes.includes(file.type.toLowerCase())
            ) {
                imageError = "Only PNG, JPG and JPEG images are allowed.";
            } else if (file.size > 2 * 1024 * 1024) {
                imageError = "Profile image must be 2 MB or smaller.";
            }
        }

        setBatchRows((previous) => previous.map((row) => (
            row.id === rowId
                ? {
                    ...row,
                    profileImage: imageError ? null : file,
                    imageError,
                    status: row.status === "created" ? "created" : imageError ? "error" : "pending",
                    error: imageError
                }
                : row
        )));
        input.value = "";
    };

    // CR-010: Optional student profile image validation.
    const handleProfileImageChange = (event) => {
        const file = event.target.files?.[0] || null;
        setProfileImageError("");

        if (!file) {
            setProfileImage(null);
            return;
        }

        const extension = file.name.split(".").pop()?.toLowerCase();
        const allowedExtensions = ["png", "jpg", "jpeg"];
        const allowedMimeTypes = ["image/png", "image/jpeg"];

        if (!allowedExtensions.includes(extension) ||
            !allowedMimeTypes.includes(file.type.toLowerCase())) {
            setProfileImage(null);
            event.target.value = "";
            setProfileImageError("Only PNG, JPG and JPEG images are allowed.");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setProfileImage(null);
            event.target.value = "";
            setProfileImageError("Profile image must be 2 MB or smaller.");
            return;
        }

        setProfileImage(file);
    };

    // ============================================================
    // FIELD VALIDATION
    // ============================================================

    const validateField = (name, value) => {
        const v = (value || "").trim();

        switch (name) {
            case "registrationNo":
                if (!v) {
                    return "Registration number is required.";
                }

                if (!/^[A-Za-z0-9_-]+$/.test(v)) {
                    return "Only letters, numbers, hyphens, or underscores allowed.";
                }

                return null;

            case "firstName":
                if (!v) {
                    return "First name is required.";
                }

                if (v.length < 3) {
                    return "First name must be at least 3 characters.";
                }

                if (!/^[A-Za-z\s]+$/.test(v)) {
                    return "First name must contain letters only.";
                }

                return null;

            case "lastName":
                if (!v) {
                    return "Last name is required.";
                }

                if (v.length < 3) {
                    return "Last name must be at least 3 characters.";
                }

                if (!/^[A-Za-z\s]+$/.test(v)) {
                    return "Last name must contain letters only.";
                }

                return null;

            case "email":
                if (!v) {
                    return "Email address is required.";
                }

                if (
                    !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v)
                ) {
                    return "Enter a valid email address (e.g. user@example.com).";
                }

                return null;

            case "phoneNumber":
                if (!v) {
                    return "Phone number is required.";
                }

                if (!/^\d+$/.test(v)) {
                    return "Phone number must contain digits only.";
                }

                if (v.length !== 10) {
                    return "Phone number must be exactly 10 digits.";
                }

                return null;

            case "password":
                // Password is required only when adding a new student
                if (editingStudent) {
                    return null;
                }

                if (!value) {
                    return "Password is required.";
                }

                if (value.length < 8) {
                    return "Password must be at least 8 characters.";
                }

                if (!/[A-Z]/.test(value)) {
                    return "Password must include an uppercase letter.";
                }

                if (!/[a-z]/.test(value)) {
                    return "Password must include a lowercase letter.";
                }

                if (!/[0-9]/.test(value)) {
                    return "Password must include a number.";
                }

                if (!/[^A-Za-z0-9]/.test(value)) {
                    return "Password must include a special character.";
                }

                return null;

            default:
                return null;
        }
    };

    const validateAll = () => {
        const fields = [
            "registrationNo",
            "firstName",
            "lastName",
            "email",
            "phoneNumber"
        ];

        if (!editingStudent) {
            fields.push("password");
        }

        const errors = {};

        fields.forEach((name) => {
            const err = validateField(name, formData[name]);

            if (err) {
                errors[name] = err;
            }
        });

        return errors;
    };

    // ============================================================
    // INPUT HANDLERS
    // ============================================================

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        // Clear field error while typing
        if (fieldErrors[name]) {
            setFieldErrors((previous) => ({
                ...previous,
                [name]: null
            }));
        }
    };

    const handleBlur = (event) => {
        const { name, value } = event.target;

        setTouched((previous) => ({
            ...previous,
            [name]: true
        }));

        const err = validateField(name, value);

        setFieldErrors((previous) => ({
            ...previous,
            [name]: err
        }));
    };

    // ============================================================
    // CLOSE MODAL
    // ============================================================

    const handleClose = () => {
        setFormError("");
        setFieldErrors({});
        setTouched({});
        setShowPassword(false);
        onClose();
    };

    // ============================================================
    // COMPLETE FORM VALIDATION
    // ============================================================

    const validateStudentForm = (studentData = formData) => {
        const registrationNo = studentData.registrationNo.trim();
        const firstName = studentData.firstName.trim();
        const lastName = studentData.lastName.trim();
        const email = studentData.email.trim();
        const phoneNumber = studentData.phoneNumber.trim();
        const password = studentData.password;

        // Required fields
        if (
            !registrationNo ||
            !firstName ||
            !lastName ||
            !email ||
            !phoneNumber
        ) {
            return "All student fields are required.";
        }

        // Registration number
        if (!/^[A-Za-z0-9]+$/.test(registrationNo)) {
            return "Registration number can contain only letters and numbers.";
        }

        // First name minimum length
        if (firstName.length < 3) {
            return "First name must contain at least 3 characters.";
        }

        // Last name minimum length
        if (lastName.length < 3) {
            return "Last name must contain at least 3 characters.";
        }

        // Name validation
        const namePattern = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;

        if (!namePattern.test(firstName)) {
            return "First name can contain only alphabetic characters.";
        }

        if (!namePattern.test(lastName)) {
            return "Last name can contain only alphabetic characters.";
        }

        // Email validation
        const emailPattern =
            /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        if (!emailPattern.test(email)) {
            return "Please enter a valid email address.";
        }

        // Phone validation
        if (!/^\d+$/.test(phoneNumber)) {
            return "Phone number must contain numeric characters only.";
        }

        if (phoneNumber.length !== 10) {
            return "Phone number must contain exactly 10 digits.";
        }

        // Password validation only for new students
        if (!editingStudent) {
            if (!password) {
                return "Password is required for a new student.";
            }

            if (password.length < 8) {
                return "Password must contain at least 8 characters.";
            }

            if (!/[A-Z]/.test(password)) {
                return "Password must contain at least one uppercase letter.";
            }

            if (!/[a-z]/.test(password)) {
                return "Password must contain at least one lowercase letter.";
            }

            if (!/[0-9]/.test(password)) {
                return "Password must contain at least one number.";
            }

            if (!/[^A-Za-z0-9]/.test(password)) {
                return "Password must contain at least one special character.";
            }
        }

        return "";
    };

    // ============================================================
    // SUBMIT
    // ============================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");

        if (batchRows.length > 0 && !editingStudent) {
            setFormLoading(true);
            let createdCount = 0;
            let failedCount = 0;
            let permissionDenied = false;

            try {
                for (const row of batchRows) {
                    if (row.status === "created") {
                        continue;
                    }

                    if (row.imageError) {
                        failedCount += 1;
                        setBatchRows((previous) => previous.map((current) => (
                            current.id === row.id
                                ? { ...current, status: "error", error: row.imageError }
                                : current
                        )));
                        continue;
                    }

                    const validationError = validateStudentForm(row.data);
                    if (validationError) {
                        failedCount += 1;
                        setBatchRows((previous) => previous.map((current) => (
                            current.id === row.id
                                ? { ...current, status: "error", error: validationError }
                                : current
                        )));
                        continue;
                    }

                    const studentFormData = new FormData();
                    studentFormData.append("registrationNo", row.data.registrationNo.trim());
                    studentFormData.append("firstName", row.data.firstName.trim());
                    studentFormData.append("lastName", row.data.lastName.trim());
                    studentFormData.append("email", row.data.email.trim());
                    studentFormData.append("phoneNumber", row.data.phoneNumber.trim());
                    studentFormData.append("password", row.data.password);
                    if (row.profileImage) {
                        studentFormData.append("profileImage", row.profileImage);
                    }

                    try {
                        await apiRequest("/api/students/", {
                            method: "POST",
                            body: studentFormData
                        });
                        createdCount += 1;
                        setBatchRows((previous) => previous.map((current) => (
                            current.id === row.id
                                ? { ...current, status: "created", error: "" }
                                : current
                        )));
                    } catch (error) {
                        console.error(`Student import failed for row ${row.id + 1}:`, error);
                        failedCount += 1;
                        setBatchRows((previous) => previous.map((current) => (
                            current.id === row.id
                                ? {
                                    ...current,
                                    status: "error",
                                    error: error.message || "Failed to create this student."
                                }
                                : current
                        )));

                        if (error.status === 401) {
                            if (createdCount > 0) {
                                onSuccess();
                            }
                            onAuthError();
                            return;
                        }
                        if (error.status === 403) {
                            permissionDenied = true;
                            setBatchRows((previous) => previous.map((current) => (
                                current.id === row.id
                                    ? {
                                        ...current,
                                        status: "error",
                                        error: "You do not have permission to modify students."
                                    }
                                    : current
                            )));
                            setFormError("You do not have permission to modify students.");
                            break;
                        }
                    }
                }
            } finally {
                setFormLoading(false);
            }

            if (createdCount > 0) {
                onSuccess();
            }

            if (permissionDenied) {
                return;
            }

            if (failedCount > 0) {
                setFormError(
                    `${createdCount} student${createdCount === 1 ? "" : "s"} created; ` +
                    `${failedCount} row${failedCount === 1 ? "" : "s"} need attention. ` +
                    "Correct the failed rows and submit again."
                );
                return;
            }

            if (batchRows.every((row) => row.status === "created") || createdCount > 0) {
                handleClose();
            }
            return;
        }

        if (profileImageError) {
            setFormError(profileImageError);
            return;
        }

        // Validate all fields
        const validationError = validateStudentForm();

        if (validationError) {
            setFormError(validationError);

            // Show all field errors
            const errors = validateAll();
            setFieldErrors(errors);

            const touchedFields = {};

            Object.keys(errors).forEach((name) => {
                touchedFields[name] = true;
            });

            setTouched(touchedFields);

            return;
        }

        try {
            setFormLoading(true);

            // ====================================================
            // EDIT STUDENT
            // ====================================================

            if (editingStudent) {
                const studentFormData = new FormData();
                studentFormData.append("registrationNo", formData.registrationNo.trim());
                studentFormData.append("firstName", formData.firstName.trim());
                studentFormData.append("lastName", formData.lastName.trim());
                studentFormData.append("email", formData.email.trim());
                studentFormData.append("phoneNumber", formData.phoneNumber.trim());

                if (profileImage) {
                    studentFormData.append("profileImage", profileImage);
                }

                await apiRequest(
                    `/api/students/${editingStudent.student_id}`,
                    {
                        method: "PUT",
                        body: studentFormData
                    }
                );
            }

            // ====================================================
            // ADD STUDENT
            // ====================================================

            else {
                const studentFormData = new FormData();
                studentFormData.append("registrationNo", formData.registrationNo.trim());
                studentFormData.append("firstName", formData.firstName.trim());
                studentFormData.append("lastName", formData.lastName.trim());
                studentFormData.append("email", formData.email.trim());
                studentFormData.append("phoneNumber", formData.phoneNumber.trim());
                studentFormData.append("password", formData.password);

                if (profileImage) {
                    studentFormData.append("profileImage", profileImage);
                }

                await apiRequest(
                    "/api/students/",
                    {
                        method: "POST",
                        body: studentFormData
                    }
                );
            }

            // Success
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

            setFormError(
                error.message || "Failed to save student."
            );

        } finally {
            setFormLoading(false);
        }
    };

    // Don't render when modal is closed
    if (!show) {
        return null;
    }

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div
            className="modal-overlay"
            onClick={handleClose}
        >
            <div
                className="modal-content student-form-card"
                onClick={(event) => event.stopPropagation()}
            >

                {/* Header */}
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
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>

                {/* General Error */}
                {formError && (
                    <div className="dashboard-error">
                        {formError}
                    </div>
                )}

                {/* Form */}
                <form
                    className="student-form"
                    onSubmit={handleSubmit}
                >

                    {!editingStudent && (
                        <div className="form-group csv-import-control">
                            <label htmlFor="sf-csvImport">
                                Import multiple students from CSV (Optional)
                            </label>
                            <input
                                id="sf-csvImport"
                                type="file"
                                accept=".csv,text/csv"
                                onChange={handleCsvFileChange}
                                disabled={formLoading || batchRows.some((row) => row.status === "created")}
                                aria-describedby="sf-csvImport-hint"
                            />
                            <span id="sf-csvImport-hint" className="field-hint">
                                One student per row. Required columns: registrationNo, firstName,
                                lastName, email, phoneNumber. Optional: password (enter each
                                student&apos;s password below if omitted). Optional profile images
                                can be selected per student after import.
                            </span>
                            {csvImportError && (
                                <span className="field-error-msg" role="alert">
                                    {csvImportError}
                                </span>
                            )}
                        </div>
                    )}

                    {batchRows.length > 0 ? (
                        <div className="student-csv-batch">
                            <div className="student-csv-batch-summary" role="status">
                                {batchRows.filter((row) => row.status === "created").length}
                                {" of "}
                                {batchRows.length}
                                {" students created. Review and edit each row before submitting."}
                            </div>
                            <div className="student-csv-table-scroll">
                                <table className="student-csv-table">
                                    <thead>
                                        <tr>
                                            <th scope="col">Registration No.</th>
                                            <th scope="col">First Name</th>
                                            <th scope="col">Last Name</th>
                                            <th scope="col">Email</th>
                                            <th scope="col">Phone Number</th>
                                            <th scope="col">Password</th>
                                            <th scope="col">Profile Image</th>
                                            <th scope="col">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {batchRows.map((row) => (
                                            <Fragment key={row.id}>
                                                <tr>
                                                    {[
                                                        ["registrationNo", "text"],
                                                        ["firstName", "text"],
                                                        ["lastName", "text"],
                                                        ["email", "text"],
                                                        ["phoneNumber", "text"],
                                                        ["password", "password"]
                                                    ].map(([field, type]) => (
                                                        <td key={field}>
                                                            <label
                                                                className="visually-hidden"
                                                                htmlFor={`sf-batch-${row.id}-${field}`}
                                                            >
                                                                Student {row.id + 1} {CSV_FIELD_LABELS[field]}
                                                            </label>
                                                            <input
                                                                id={`sf-batch-${row.id}-${field}`}
                                                                type={type}
                                                                value={row.data[field]}
                                                                onChange={(event) => handleBatchFieldChange(
                                                                    row.id,
                                                                    field,
                                                                    event.target.value
                                                                )}
                                                                disabled={formLoading || row.status === "created"}
                                                                autoComplete="off"
                                                            />
                                                        </td>
                                                    ))}
                                                    <td>
                                                        <label
                                                            className="visually-hidden"
                                                            htmlFor={`sf-batch-${row.id}-profileImage`}
                                                        >
                                                            Student {row.id + 1} Profile Image
                                                        </label>
                                                        <input
                                                            id={`sf-batch-${row.id}-profileImage`}
                                                            type="file"
                                                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                                            onChange={(event) => handleBatchProfileImageChange(
                                                                row.id,
                                                                event
                                                            )}
                                                            disabled={formLoading || row.status === "created"}
                                                        />
                                                        {row.profileImage && (
                                                            <span className="field-hint">
                                                                {row.profileImage.name}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`student-csv-row-status is-${row.status}`}>
                                                            {row.status === "created"
                                                                ? "Created"
                                                                : row.status === "error"
                                                                    ? "Needs attention"
                                                                    : "Ready"}
                                                        </span>
                                                    </td>
                                                </tr>
                                                {row.error && (
                                                    <tr className="student-csv-row-error">
                                                        <td colSpan="8" role="alert">
                                                            Row {row.id + 1}: {row.error}
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <>
                    {/* Registration Number */}
                    <div className="form-group">

                        <label htmlFor="sf-registrationNo">
                            Registration Number
                        </label>

                        <input
                            id="sf-registrationNo"
                            type="text"
                            name="registrationNo"
                            value={formData.registrationNo}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            disabled={formLoading}
                            required
                        />

                        {touched.registrationNo &&
                        fieldErrors.registrationNo ? (
                            <span className="field-error-msg">
                                {fieldErrors.registrationNo}
                            </span>
                        ) : null}

                    </div>

                    {/* First Name */}
                    <div className="form-group">

                        <label htmlFor="sf-firstName">
                            First Name
                        </label>

                        <input
                            id="sf-firstName"
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            disabled={formLoading}
                            required
                        />

                        {touched.firstName &&
                        fieldErrors.firstName ? (
                            <span className="field-error-msg">
                                {fieldErrors.firstName}
                            </span>
                        ) : null}

                    </div>

                    {/* Last Name */}
                    <div className="form-group">

                        <label htmlFor="sf-lastName">
                            Last Name
                        </label>

                        <input
                            id="sf-lastName"
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            disabled={formLoading}
                            required
                        />

                        {touched.lastName &&
                        fieldErrors.lastName ? (
                            <span className="field-error-msg">
                                {fieldErrors.lastName}
                            </span>
                        ) : null}

                    </div>

                    {/* Email */}
                    <div className="form-group">

                        <label htmlFor="sf-email">
                            Email
                        </label>

                        <input
                            id="sf-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            disabled={formLoading}
                            required
                        />

                        {touched.email &&
                        fieldErrors.email ? (
                            <span className="field-error-msg">
                                {fieldErrors.email}
                            </span>
                        ) : null}

                    </div>

                    {/* Phone Number */}
                    <div className="form-group">

                        <label htmlFor="sf-phoneNumber">
                            Phone Number
                        </label>

                        <input
                            id="sf-phoneNumber"
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            disabled={formLoading}
                            maxLength={10}
                            inputMode="numeric"
                            required
                        />

                        {touched.phoneNumber &&
                        fieldErrors.phoneNumber ? (
                            <span className="field-error-msg">
                                {fieldErrors.phoneNumber}
                            </span>
                        ) : null}

                    </div>

                    {/* CR-010: Optional Profile Image */}
                    <div className="form-group">
                        <label htmlFor="sf-profileImage">
                            Profile Image (Optional)
                        </label>
                        <input
                            id="sf-profileImage"
                            type="file"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            onChange={handleProfileImageChange}
                            disabled={formLoading}
                        />
                        <span className="field-hint">
                            Supported formats: PNG, JPG, JPEG. Maximum size: 2 MB.
                        </span>
                        {profileImage && (
                            <span className="field-hint">
                                Selected: {profileImage.name}
                            </span>
                        )}
                        {profileImageError && (
                            <span className="field-error-msg" role="alert">
                                {profileImageError}
                            </span>
                        )}
                    </div>

                    {/* Password - Add Student Only */}
                    {!editingStudent && (
                        <div className="form-group">

                            <label htmlFor="sf-password">
                                Password
                            </label>

                            <div className="student-password-wrapper">

                                <input
                                    id="sf-password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    disabled={formLoading}
                                    required
                                    autoComplete="new-password"
                                    aria-describedby="sf-password-hint"
                                    aria-invalid={
                                        !!(
                                            touched.password &&
                                            fieldErrors.password
                                        )
                                    }
                                />

                                <button
                                    type="button"
                                    className="student-password-toggle"
                                    onClick={() =>
                                        setShowPassword(
                                            (previous) =>
                                                !previous
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
                                    {showPassword ? (
                                        <svg
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M3 3l18 18"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                            />

                                            <path
                                                d="M10.58 10.58a2 2 0 0 0 2.83 2.83"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                            />

                                            <path
                                                d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 8.5 4 10 8a16.4 16.4 0 0 1-3.08 4.71"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />

                                            <path
                                                d="M6.61 6.61C4.99 7.72 3.78 9.47 3 12c1.5 4 5 8 9 8 1.61 0 3.09-.48 4.39-1.28"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />

                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="2.5"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            />
                                        </svg>
                                    )}
                                </button>

                            </div>

                            {touched.password &&
                            fieldErrors.password ? (
                                <span
                                    id="sf-password-hint"
                                    className="field-error-msg"
                                >
                                    {fieldErrors.password}
                                </span>
                            ) : (
                                <span
                                    id="sf-password-hint"
                                    className="field-hint"
                                >
                                    Password must contain uppercase,
                                    lowercase, number and special
                                    character.
                                </span>
                            )}

                        </div>
                    )}
                        </>
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
                            disabled={formLoading || (
                                batchRows.length > 0 &&
                                batchRows.every((row) => row.status === "created")
                            )}
                        >
                            {formLoading
                                ? batchRows.length > 0
                                    ? "Creating students..."
                                    : "Saving..."
                                : editingStudent
                                    ? "Update Student"
                                    : batchRows.length > 0
                                        ? `Create ${batchRows.filter((row) => row.status !== "created").length} Student${batchRows.filter((row) => row.status !== "created").length === 1 ? "" : "s"}`
                                        : "Create Student"}
                        </button>

                    </div>

                </form>

            </div>
        </div>
    );
}

export default StudentFormModal;