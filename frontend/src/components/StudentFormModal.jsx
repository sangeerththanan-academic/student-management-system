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

        setFormErrors({});
        setFormError("");
    }, [editingStudent, show]);


    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        // Remove field error when user starts correcting it
        setFormErrors((previous) => ({
            ...previous,
            [name]: ""
        }));

        setFormError("");
    };


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
            errors.registrationNo = "Registration number is required.";
        } else if (!/^[A-Za-z0-9/_-]+$/.test(registrationNo)) {
            errors.registrationNo =
                "Registration number contains invalid characters.";
        }

        // Name validation
        const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

        if (!firstName) {
            errors.firstName = "First name is required.";
        } else if (firstName.length < 3) {
            errors.firstName =
                "First name must contain at least 3 characters.";
        } else if (!nameRegex.test(firstName)) {
            errors.firstName =
                "First name can contain alphabetic characters only.";
        }

        if (!lastName) {
            errors.lastName = "Last name is required.";
        } else if (lastName.length < 3) {
            errors.lastName =
                "Last name must contain at least 3 characters.";
        } else if (!nameRegex.test(lastName)) {
            errors.lastName =
                "Last name can contain alphabetic characters only.";
        }

        // Email validation
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            errors.email = "Email address is required.";
        } else if (!emailRegex.test(email)) {
            errors.email = "Please enter a valid email address.";
        }

        // Phone validation
        if (!phoneNumber) {
            errors.phoneNumber = "Phone number is required.";
        } else if (!/^\d+$/.test(phoneNumber)) {
            errors.phoneNumber =
                "Phone number must contain numbers only.";
        } else if (phoneNumber.length < 10) {
            errors.phoneNumber =
                "Phone number must contain exactly 10 digits.";
        } else if (phoneNumber.length > 10) {
            errors.phoneNumber =
                "Phone number must contain exactly 10 digits.";
        }

        // Password validation only when creating
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
        setFormErrors({});
        onClose();
    };


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

                        {formErrors.registrationNo && (
                            <small className="form-error">
                                {formErrors.registrationNo}
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

                        {formErrors.firstName && (
                            <small className="form-error">
                                {formErrors.firstName}
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

                        {formErrors.lastName && (
                            <small className="form-error">
                                {formErrors.lastName}
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

                        {formErrors.email && (
                            <small className="form-error">
                                {formErrors.email}
                            </small>
                        )}
                    </div>


                    {/* Phone */}
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
                            maxLength={10}
                            inputMode="numeric"
                            required
                        />

                        {formErrors.phoneNumber && (
                            <small className="form-error">
                                {formErrors.phoneNumber}
                            </small>
                        )}
                    </div>


                    {/* Password - Create only */}
                    {!editingStudent && (
                        <div className="form-group">
                            <label>
                                Password
                            </label>

                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                disabled={formLoading}
                                required
                            />

                            {formErrors.password && (
                                <small className="form-error">
                                    {formErrors.password}
                                </small>
                            )}

                            <small>
                                Password must contain at least 8 characters,
                                including uppercase, lowercase, number and
                                special character.
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