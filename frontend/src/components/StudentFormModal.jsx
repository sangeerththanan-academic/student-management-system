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


    // Password - only required when creating a new student
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

    }, [editingStudent, show]);


    // Handle field changes
    const handleInputChange = (event) => {
        const { name, value } = event.target;

        let newValue = value;


        // Phone number:
        // Allow numeric characters only.
        // Do NOT silently truncate values beyond 10 digits.
        if (name === "phoneNumber") {
            newValue = value.replace(/\D/g, "");
        }


        setFormData((previous) => ({
            ...previous,
            [name]: newValue
        }));


        // Remove only the error belonging to the field being edited.
        if (fieldErrors[name]) {
            setFieldErrors((previous) => ({
                ...previous,
                [name]: ""
            }));
        }


        // Remove the general form error when user starts correcting data.
        if (formError) {
            setFormError("");
        }
    };


    // Close modal only when explicitly requested by the user
    const handleClose = () => {

        // Do not allow closing while saving
        if (formLoading) {
            return;
        }

        setFormError("");
        setFieldErrors({});

        onClose();
    };


    // Prevent backdrop click from closing the modal
    const handleModalContentClick = (event) => {
        event.stopPropagation();
    };


    const handleSubmit = async (event) => {
        event.preventDefault();

        // Prevent duplicate submissions
        if (formLoading) {
            return;
        }


        // Clear previous general error
        setFormError("");


        // Validate form before API request
        const errors = validateStudentForm(formData, {
            requirePassword: !editingStudent
        });


        setFieldErrors(errors);


        // Stop submission if validation failed
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

                            password:
                                formData.password
                        })
                    }
                );
            }


            // Only after successful API request:
            // refresh student list
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
                    <div className="dashboard-error">
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


                    {/* Password - Add only */}
                    {!editingStudent && (
                        <div className="form-group">

                            <label htmlFor="password">
                                Password
                            </label>

                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                disabled={formLoading}
                                required
                            />

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