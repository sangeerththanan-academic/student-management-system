import { useEffect, useState } from "react";

import apiRequest from "../services/api";

// CR-004 validation rules
const REGISTRATION_NO_REGEX = /^REG\d+$/;
const NAME_REGEX = /^[A-Za-z]{3,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;


// SHARED STUDENT VALIDATION (CR-004)
const validateStudentForm = (
    data,
    { requirePassword = false } = {}
) => {
    const errors = {};

    const registrationNo = (data.registrationNo || "").trim();
    const firstName = (data.firstName || "").trim();
    const lastName = (data.lastName || "").trim();
    const email = (data.email || "").trim();
    const phoneNumber = (data.phoneNumber || "").trim();
    const password = data.password || "";

    // Registration number
    if (!registrationNo) {
        errors.registrationNo = "Registration number is required.";
    } else if (!REGISTRATION_NO_REGEX.test(registrationNo)) {
        errors.registrationNo =
            "Registration number must start with REG and contain numbers only after REG (e.g. REG001).";
    }

    // First name
    if (!firstName) {
        errors.firstName = "First name is required.";
    } else if (!NAME_REGEX.test(firstName)) {
        errors.firstName =
            "First name must be at least 3 letters and contain letters only.";
    }

    // Last name
    if (!lastName) {
        errors.lastName = "Last name is required.";
    } else if (!NAME_REGEX.test(lastName)) {
        errors.lastName =
            "Last name must be at least 3 letters and contain letters only.";
    }

    // Email
    if (!email) {
        errors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email)) {
        errors.email = "Enter a valid email address.";
    }

    // Phone number
    if (!phoneNumber) {
        errors.phoneNumber = "Phone number is required.";
    } else if (!PHONE_REGEX.test(phoneNumber)) {
        errors.phoneNumber = "Phone number must be exactly 10 digits.";
    }

    // Password - required only when creating a new student
    if (requirePassword) {
        if (!password) {
            errors.password = "Password is required for a new student.";
        } else if (!PASSWORD_REGEX.test(password)) {
            errors.password =
                "Password must be at least 8 characters and include uppercase, lowercase, number and special character.";
        }
    }

    return errors;
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

    // Password visibility toggle
    const [showPassword, setShowPassword] = useState(false);


    // Reset form when modal opens or editing student changes
    useEffect(() => {
        if (!show) {
            return;
        }

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
        setFormLoading(false);

        // Always hide password when opening/resetting the modal
        setShowPassword(false);

    }, [editingStudent, show]);


    // Handle field changes
    const handleInputChange = (event) => {
        const { name, value } = event.target;

        let newValue = value;

        // Allow numeric characters only for phone number
        if (name === "phoneNumber") {
            newValue = value.replace(/\D/g, "");
        }

        setFormData((previous) => ({
            ...previous,
            [name]: newValue
        }));

        // Remove the error belonging to the edited field
        if (fieldErrors[name]) {
            setFieldErrors((previous) => ({
                ...previous,
                [name]: ""
            }));
        }

        // Clear general error while correcting data
        if (formError) {
            setFormError("");
        }
    };


    // Close modal only when explicitly requested
    const handleClose = () => {
        if (formLoading) {
            return;
        }

        setFormError("");
        setFieldErrors({});
        setShowPassword(false);

        onClose();
    };


    // Prevent backdrop click from closing modal
    const handleModalContentClick = (event) => {
        event.stopPropagation();
    };


    const handleSubmit = async (event) => {
        event.preventDefault();

        // Prevent duplicate submissions
        if (formLoading) {
            return;
        }

        setFormError("");

        // Validate before API request
        const errors = validateStudentForm(formData, {
            requirePassword: !editingStudent
        });

        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            setFormError(
                "Please fix the highlighted errors before saving."
            );
            return;
        }

        try {
            setFormLoading(true);

            if (editingStudent) {
                // EDIT STUDENT
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
            } else {
                // ADD STUDENT
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

                            password: formData.password
                        })
                    }
                );
            }

            // Refresh student list after successful save
            onSuccess();

            // Close modal after successful save
            handleClose();

        } catch (error) {
            console.error("Student save error:", error);

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

            // Backend validation / duplicate / other API error
            setFormError(
                error.message || "Failed to save student."
            );

        } finally {
            setFormLoading(false);
        }
    };


    if (!show) {
        return null;
    }


    return (
        <div
            className="modal-overlay"
            onClick={handleClose}
        >
            <div
                className="modal-content student-form-card"
                onClick={handleModalContentClick}
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
                        aria-label="Close"
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
                            required
                        />

                        {fieldErrors.registrationNo && (
                            <span className="field-error">
                                {fieldErrors.registrationNo}
                            </span>
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
                            required
                        />

                        {fieldErrors.firstName && (
                            <span className="field-error">
                                {fieldErrors.firstName}
                            </span>
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
                            required
                        />

                        {fieldErrors.lastName && (
                            <span className="field-error">
                                {fieldErrors.lastName}
                            </span>
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
                            required
                        />

                        {fieldErrors.email && (
                            <span className="field-error">
                                {fieldErrors.email}
                            </span>
                        )}
                    </div>


                    {/* Phone Number */}
                    <div className="form-group">
                        <label htmlFor="phoneNumber">
                            Phone Number
                        </label>

                        <input
                            id="phoneNumber"
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                            inputMode="numeric"
                            maxLength={10}
                        />

                        {fieldErrors.phoneNumber && (
                            <span className="field-error">
                                {fieldErrors.phoneNumber}
                            </span>
                        )}
                    </div>


                    {/* Password - Add only, with Show / Hide Toggle */}
                    {!editingStudent && (
                        <div className="form-group">
                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="password-input-wrapper">
                                <input
                                    id="password"
                                    className="password-input"
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
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
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
                                            <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.3 4.5 9 7a11.8 11.8 0 0 1-3 4.6" />
                                            <path d="M6.6 6.6A12 12 0 0 0 3 12c.7 2.5 4 7 9 7 1.1 0 2.1-.2 3-.6" />
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
                                            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="3"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {fieldErrors.password && (
                                <span className="field-error">
                                    {fieldErrors.password}
                                </span>
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
            </div>
        </div>
    );
}

export default StudentFormModal;