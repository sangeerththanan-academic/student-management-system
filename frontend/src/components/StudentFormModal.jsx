
import { useEffect, useState } from "react";
import apiRequest from "../services/api";

function StudentFormModal({
    show,
    editingStudent,
    onClose,
    onSuccess,
    onAuthError
}) {
    const initialFormData = {
        registrationNo: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: ""
    };

    const [formData, setFormData] = useState(initialFormData);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!show) return;

        setShowPassword(false);

        if (editingStudent) {
            setFormData({
                registrationNo: editingStudent.registration_no || "",
                firstName: editingStudent.first_name || "",
                lastName: editingStudent.last_name || "",
                email: editingStudent.email || "",
                phoneNumber: String(editingStudent.phone_number || ""),
                password: ""
            });
        } else {
            setFormData({ ...initialFormData });
        }

        setFormError("");
        setFieldErrors({});
        setTouched({});
    }, [editingStudent, show]);

    // FIELD VALIDATION
    const validateField = (name, value) => {
        const v = String(value ?? "").trim();

        switch (name) {
            case "registrationNo":
                if (!v) {
                    return "Registration number is required.";
                }
                if (!/^[A-Za-z0-9_-]+$/.test(v)) {
                    return "Only letters, numbers, hyphens, and underscores are allowed.";
                }
                return null;

            case "firstName":
                if (!v) {
                    return "First name is required.";
                }
                if (v.length < 3) {
                    return "First name must be at least 3 characters.";
                }
                if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(v)) {
                    return "First name must contain letters and spaces only.";
                }
                return null;

            case "lastName":
                if (!v) {
                    return "Last name is required.";
                }
                if (v.length < 3) {
                    return "Last name must be at least 3 characters.";
                }
                if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(v)) {
                    return "Last name must contain letters and spaces only.";
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
                    return "Password must contain an uppercase letter.";
                }
                if (!/[a-z]/.test(value)) {
                    return "Password must contain a lowercase letter.";
                }
                if (!/\d/.test(value)) {
                    return "Password must contain a number.";
                }
                if (!/[@$!*?&%]/.test(value)) {
                    return "Password must contain a special character.";
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
            const error = validateField(name, formData[name]);
            if (error) {
                errors[name] = error;
            }
        });

        return errors;
    };

    // INPUT CHANGE
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        let nextValue = value;

        if (name === "phoneNumber") {
            if (!/^\d*$/.test(value) || value.length > 10) {
                return;
            }
            nextValue = value;
        }

        setFormData((previous) => ({
            ...previous,
            [name]: nextValue
        }));

        setFormError("");

        if (touched[name]) {
            const error = validateField(name, nextValue);

            setFieldErrors((previous) => ({
                ...previous,
                [name]: error
            }));
        }
    };

    // INPUT BLUR
    const handleBlur = (event) => {
        const { name, value } = event.target;

        setTouched((previous) => ({
            ...previous,
            [name]: true
        }));

        const error = validateField(name, value);

        setFieldErrors((previous) => ({
            ...previous,
            [name]: error
        }));
    };

    // CLOSE MODAL
    const handleClose = () => {
        if (formLoading) return;

        setShowPassword(false);
        setFormError("");
        setFieldErrors({});
        setTouched({});
        onClose();
    };

    // SUBMIT FORM
    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        const errors = validateAll();

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

        const allTouched = {};
        fields.forEach((field) => {
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

            if (error.status === 400 && error.errors) {
                setFieldErrors((previous) => ({
                    ...previous,
                    ...error.errors
                }));

                setFormError(
                    error.message || "Please check the form fields."
                );
                return;
            }

            setFormError(error.message || "Failed to save student.");
        } finally {
            setFormLoading(false);
        }
    };

    // FORM FIELD
    const renderField = (label, name, type = "text", hint = "") => {
        const hasError = Boolean(touched[name] && fieldErrors[name]);
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
                            {showPassword ? (
                                <svg
                                    viewBox="0 0 24 24"
                                    width="20"
                                    height="20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M3 3l18 18" />
                                    <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                                    <path d="M9.9 5.2A11 11 0 0121 12a11.8 11.8 0 01-4 4.8" />
                                    <path d="M6.2 6.2A12 12 0 003 12a11 11 0 0014.2 6.3" />
                                </svg>
                            ) : (
                                <svg
                                    viewBox="0 0 24 24"
                                    width="20"
                                    height="20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
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
                        maxLength={name === "phoneNumber" ? 10 : undefined}
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
                    {renderField(
                        "Registration Number",
                        "registrationNo",
                        "text",
                        "Letters, numbers, hyphens, or underscores only."
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