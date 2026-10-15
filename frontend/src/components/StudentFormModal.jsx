
import { useEffect, useState } from "react";
import apiRequest from "../services/api";
import { LuEye, LuEyeClosed } from "react-icons/lu";

function StudentFormModal({
    show,
    editingStudent,
    onClose,
    onSuccess,
    onAuthError
}) {
    const [showPassword, setShowPassword] = useState(false);

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
    const [touched, setTouched] = useState({});

    // Reset form when modal opens or student changes
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

        setShowPassword(false);
        setFormError("");
        setFieldErrors({});
        setTouched({});
    }, [editingStudent, show]);

    // Validate individual fields
    const validateField = (name, value) => {
        const v = String(value ?? "").trim();

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
                if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v)) {
                    return "Enter a valid email address.";
                }
                return null;

            case "phoneNumber":
                if (!v) {
                    return "Phone number is required.";
                }
                if (!/^\d{10}$/.test(v)) {
                    return "Phone number must be exactly 10 digits.";
                }
                return null;

            case "password":
                // Password is not required when editing a student.
                if (editingStudent) return null;

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

    // Validate all fields before submission
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

    // Update input values
    const handleInputChange = (event) => {
        const { name, value } = event.target;

        // Phone number: digits only, maximum 10 digits
        if (name === "phoneNumber") {
            const digitsOnly = value.replace(/\D/g, "").slice(0, 10);

            setFormData((previous) => ({
                ...previous,
                phoneNumber: digitsOnly
            }));

            if (touched[name]) {
                setFieldErrors((previous) => ({
                    ...previous,
                    [name]: validateField(name, digitsOnly)
                }));
            }

            return;
        }

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        if (touched[name]) {
            setFieldErrors((previous) => ({
                ...previous,
                [name]: validateField(name, value)
            }));
        }
    };

    // Validate field when user leaves it
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

        setFormError("");
        setFieldErrors({});
        setTouched({});
        setShowPassword(false);

        onClose();
    };

    // Submit Add/Edit Student form
    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");

        const errors = validateAll();

        setFieldErrors(errors);

        setTouched({
            registrationNo: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            ...(!editingStudent ? { password: true } : {})
        });

        if (Object.keys(errors).length > 0) {
            setFormError("Please correct the highlighted fields.");
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
                await apiRequest(
                    "/api/students/",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            ...studentData,
                            password: formData.password
                        })
                    }
                );
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

            setFormError(
                error.message || "Failed to save student."
            );

        } finally {
            setFormLoading(false);
        }
    };

    // Render an input field
    const renderField = (label, name, type = "text", hint = "") => {
        const hasError = Boolean(touched[name] && fieldErrors[name]);
        const hintId = `sf-${name}-hint`;

        return (
            <div
                key={name}
                className={`form-group${hasError ? " field-error" : ""}`}
            >
                <label htmlFor={`sf-${name}`}>
                    {label}
                </label>

                {name === "password" ? (
                    <div className="password-input-wrapper">
                        <input
                            id={`sf-${name}`}
                            type={showPassword ? "text" : "password"}
                            name={name}
                            value={formData[name]}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            disabled={formLoading}
                            autoComplete="new-password"
                            className="password-input"
                            aria-describedby={hintId}
                            aria-invalid={hasError}
                        />

                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => {
                                setShowPassword((previous) => !previous);
                            }}
                            aria-label={
                                showPassword ? "Hide password" : "Show password"
                            }
                            aria-pressed={showPassword}
                            disabled={formLoading}
                        >
                            {showPassword ? (
                                <LuEyeClosed size={20} aria-hidden="true" />
                            ) : (
                                <LuEye size={20} aria-hidden="true" />
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
                        autoComplete="off"
                        aria-describedby={hintId}
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
                    <span
                        id={hintId}
                        className="field-hint"
                    >
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
                        "tel",
                        "Exactly 10 digits."
                    )}

                    {!editingStudent && renderField(
                        "Password",
                        "password",
                        "password",
                        "At least 8 characters, including uppercase, lowercase, number, and special character."
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
