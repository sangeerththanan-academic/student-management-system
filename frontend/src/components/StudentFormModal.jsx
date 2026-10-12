import { useEffect, useState } from "react";
import apiRequest from "../services/api";

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

    const [formErrors, setFormErrors] = useState({});
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");

    // Password show/hide state
    const [showPassword, setShowPassword] = useState(false);

    // Reset form when modal opens or editing student changes
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

        setFormErrors({});
        setFormError("");
        setShowPassword(false);
    }, [editingStudent, show]);

    // =====================================================
    // FIELD VALIDATION
    // =====================================================

    const validateField = (name, value) => {
        const v =
            typeof value === "string" ? value.trim() : "";

        switch (name) {
            case "registrationNo":
                if (!v) {
                    return "Registration number is required.";
                }

                if (!/^[A-Za-z0-9/_-]+$/.test(v)) {
                    return "Registration number contains invalid characters.";
                }

                return null;

            case "firstName":
                if (!v) {
                    return "First name is required.";
                }

                if (v.length < 3) {
                    return "First name must contain at least 3 characters.";
                }

                if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(v)) {
                    return "First name contains invalid characters.";
                }

                return null;

            case "lastName":
                if (!v) {
                    return "Last name is required.";
                }

                if (v.length < 3) {
                    return "Last name must contain at least 3 characters.";
                }

                if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(v)) {
                    return "Last name contains invalid characters.";
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

                if (!/^\d+$/.test(v)) {
                    return "Phone number must contain numbers only.";
                }

                if (v.length !== 10) {
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
                    return "Password must contain at least 8 characters.";
                }

                if (!/[A-Z]/.test(value)) {
                    return "Password must contain at least one uppercase letter.";
                }

                if (!/[a-z]/.test(value)) {
                    return "Password must contain at least one lowercase letter.";
                }

                if (!/[0-9]/.test(value)) {
                    return "Password must contain at least one number.";
                }

                if (!/[^A-Za-z0-9]/.test(value)) {
                    return "Password must contain at least one special character.";
                }

                return null;

            default:
                return null;
        }
    };

    // =====================================================
    // VALIDATE ALL FIELDS
    // =====================================================

    const validateForm = () => {
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

    // =====================================================
    // HANDLE INPUT CHANGES
    // =====================================================

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        // Validate the changed field and update its error
        const error = validateField(name, value);

        setFormErrors((previous) => {
            const updatedErrors = { ...previous };

            if (error) {
                updatedErrors[name] = error;
            } else {
                delete updatedErrors[name];
            }

            return updatedErrors;
        });

        setFormError("");
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const handleClose = () => {
        if (formLoading) return;

        setFormError("");
        setFormErrors({});
        setShowPassword(false);

        onClose();
    };

    // =====================================================
    // SUBMIT FORM
    // =====================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");

        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            return;
        }

        try {
            setFormLoading(true);

            if (editingStudent) {
                // Update existing student
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
                // Create new student
                await apiRequest(
                    "/api/students/",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            registrationNo: formData.registrationNo.trim(),
                            firstName: formData.firstName.trim(),
                            lastName: formData.lastName.trim(),
                            email: formData.email.trim(),
                            phoneNumber: formData.phoneNumber.trim(),
                            password: formData.password
                        })
                    }
                );
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

            if (error.status === 409) {
                setFormError(
                    error.message ||
                    "Registration number or email is already registered."
                );
                return;
            }

            if (error.status === 400 && error.errors) {
                setFormErrors(error.errors);
                return;
            }

            setFormError(
                error.message || "Failed to save student."
            );

        } finally {
            setFormLoading(false);
        }
    };

    // Do not render when modal is closed
    if (!show) return null;

    // =====================================================
    // RENDER FORM
    // =====================================================

    return (
        <div
            className="modal-overlay"
            onClick={handleClose}
        >
            <div
                className="modal-content student-form-card"
                onClick={(event) => event.stopPropagation()}
            >
                {/* Modal Header */}
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

                {/* General Error */}
                {formError && (
                    <div
                        className="dashboard-error"
                        role="alert"
                    >
                        {formError}
                    </div>
                )}

                {/* Student Form */}
                <form
                    className="student-form"
                    onSubmit={handleSubmit}
                    noValidate
                >
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
                            disabled={formLoading}
                            autoComplete="off"
                            aria-invalid={!!formErrors.registrationNo}
                            required
                        />

                        {formErrors.registrationNo && (
                            <small className="form-error">
                                {formErrors.registrationNo}
                            </small>
                        )}
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
                            disabled={formLoading}
                            autoComplete="given-name"
                            aria-invalid={!!formErrors.firstName}
                            required
                        />

                        {formErrors.firstName && (
                            <small className="form-error">
                                {formErrors.firstName}
                            </small>
                        )}
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
                            disabled={formLoading}
                            autoComplete="family-name"
                            aria-invalid={!!formErrors.lastName}
                            required
                        />

                        {formErrors.lastName && (
                            <small className="form-error">
                                {formErrors.lastName}
                            </small>
                        )}
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
                            disabled={formLoading}
                            autoComplete="email"
                            aria-invalid={!!formErrors.email}
                            required
                        />

                        {formErrors.email && (
                            <small className="form-error">
                                {formErrors.email}
                            </small>
                        )}
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
                            disabled={formLoading}
                            maxLength={10}
                            inputMode="numeric"
                            autoComplete="tel"
                            aria-invalid={!!formErrors.phoneNumber}
                            required
                        />

                        {formErrors.phoneNumber && (
                            <small className="form-error">
                                {formErrors.phoneNumber}
                            </small>
                        )}
                    </div>

                    {/* Password - Create Only */}
                    {!editingStudent && (
                        <div className="form-group">
                            <label htmlFor="sf-password">
                                Password
                            </label>

                            <div className="password-input-wrapper">
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
                                    disabled={formLoading}
                                    autoComplete="new-password"
                                    aria-invalid={!!formErrors.password}
                                    aria-describedby="sf-password-hint"
                                    required
                                />

                                <button
                                    type="button"
                                    className="toggle-password-button"
                                    onClick={() =>
                                        setShowPassword((previous) => !previous)
                                    }
                                    disabled={formLoading}
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    aria-pressed={showPassword}
                                    title={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword ? (
                                    // Eye-slash icon
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M3 3l18 18" />
                                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                                        <path d="M9.9 5.2A11 11 0 0 1 12 5c5 0 9 7 9 7a15 15 0 0 1-3 3.7" />
                                        <path d="M6.6 6.6C4.2 8.2 3 12 3 12s4 7 9 7a9 9 0 0 0 3.4-.7" />
                                    </svg>
                                ) : (
                                    // Eye icon
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                                </button>
                            </div>

                            {formErrors.password && (
                                <small className="form-error">
                                    {formErrors.password}
                                </small>
                            )}

                            <small
                                id="sf-password-hint"
                                className="field-hint"
                            >
                                Password must contain at least 8 characters,
                                including uppercase, lowercase, number and
                                special character.
                            </small>
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
                                    : "Create Student"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default StudentFormModal;
