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

    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

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
        setShowPassword(false);
    }, 
    [editingStudent, show]);
    


    // Handle input changes
    const handleInputChange = (event) => {
        const { name, value } = event.target;

        // CR-004: Phone number must contain digits only
        if (name === "phoneNumber") {
            if (!/^\d*$/.test(value)) {
                return;
            }

            // CR-004: Phone number maximum 10 digits
            if (value.length > 10) {
                return;
            }
        }

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        // Clear field validation error when user changes the field
        setFieldErrors((previous) => ({
            ...previous,
            [name]: ""
        }));

        setFormError("");
    };


    // CR-004: Frontend validation
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
        } else if (!/^REG\d{3}$/.test(registrationNo)) {
            errors.registrationNo =
                "Registration number must be in the format REG001.";
        }


        // First name
        if (!firstName) {
            errors.firstName =
                "First name is required.";
        } else if (firstName.length < 3) {
            errors.firstName =
                "First name must contain at least 3 characters.";
        } else if (!/^[A-Za-z]+$/.test(firstName)) {
            errors.firstName =
                "First name can contain only alphabetic characters.";
        }


        // Last name
        if (!lastName) {
            errors.lastName =
                "Last name is required.";
        } else if (lastName.length < 3) {
            errors.lastName =
                "Last name must contain at least 3 characters.";
        } else if (!/^[A-Za-z]+$/.test(lastName)) {
            errors.lastName =
                "Last name can contain only alphabetic characters.";
        }


        // Email
        if (!email) {
            errors.email =
                "Email address is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email =
                "Please enter a valid email address.";
        }


        // Phone number
        if (!phoneNumber) {
            errors.phoneNumber =
                "Phone number is required.";
        } else if (!/^\d{10}$/.test(phoneNumber)) {
            errors.phoneNumber =
                "Phone number must contain exactly 10 digits.";
        }


        // Password - only required when adding a new student
        {/* Password */}
// Password - only required when adding a new student
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
return errors;
    };

    const handleClose = () => {
        setFormError("");
        setFieldErrors({});
        onClose();
    };


    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");
        setFieldErrors({});


        // CR-004: Validate before submitting
        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
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


            // ADD STUDENT
            } else {

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


            onSuccess();
            handleClose();


        } catch (error) {

            console.error(
                "Student save error:",
                error
            );


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
                error.message ||
                "Failed to save student."
            );


        } finally {
            setFormLoading(false);
        }
    };


    if (!show) return null;

    // Helper: render one form field with inline error
    const renderField = (label, name, type = "text", hint = "") => (
        <div
            key={name}
            className={`form-group${touched[name] && fieldErrors[name] ? " field-error" : ""}`}
        >
            <label htmlFor={`sf-${name}`}>
                {label}
            </label>

            <input
                id={`sf-${name}`}
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleInputChange}
                onBlur={handleBlur}
                disabled={formLoading}
                autoComplete={type === "password" ? "new-password" : "off"}
                aria-describedby={`sf-${name}-hint`}
                aria-invalid={!!(touched[name] && fieldErrors[name])}
            />

            {touched[name] && fieldErrors[name] ? (
                <span id={`sf-${name}-hint`} className="field-error-msg">
                    {fieldErrors[name]}
                </span>
            ) : hint ? (
                <span id={`sf-${name}-hint`} className="field-hint">
                    {hint}
                </span>
            ) : null}
        </div>
    );


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
                            placeholder="REG001"
                        />

                        {fieldErrors.registrationNo && (
                            <small className="form-error">
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
                            <small className="form-error">
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
                            <small className="form-error">
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
                            <small className="form-error">
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
                        />

                        {fieldErrors.phoneNumber && (
                            <small className="form-error">
                                {fieldErrors.phoneNumber}
                            </small>
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
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={formLoading}
                required
                autoComplete="new-password"
                aria-describedby="student-password-hint"
            />

            <button
                type="button"
                className="password-toggle-button"
                onClick={() =>
                    setShowPassword(
                        (previous) => !previous
                    )
                }
                disabled={formLoading}
                aria-label={
                    showPassword
                        ? "Hide password"
                        : "Show password"
                }
                aria-pressed={showPassword}
            >
                {showPassword ? (
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                        <path d="M9.88 5.09A9.77 9.77 0 0 1 12 4.75c5 0 8.5 5.25 8.5 5.25a16.6 16.6 0 0 1-3.09 3.46" />
                        <path d="M6.61 6.61C4.13 8.24 3.5 10 3.5 10S7 15.25 12 15.25c1.06 0 2.04-.18 2.93-.49" />
                    </svg>
                ) : (
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
            </button>
        </div>

        {fieldErrors.password && (
    <small
        id="student-password-hint"
        className="form-error"
    >
        {fieldErrors.password}
    </small>
)}
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
        className="submit-button"
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