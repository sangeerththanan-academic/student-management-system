import { useEffect, useState } from "react";

import apiRequest from "../services/api";



const registrationNumberRegex = /^[A-Za-z0-9]+(?:[-/][A-Za-z0-9]+)*$/;

const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

// Basic valid email format
const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone:
// Exactly 10 numeric digits
const phoneRegex = /^\d{10}$/;

// Strong password:

const uppercaseRegex = /[A-Z]/;
const lowercaseRegex = /[a-z]/;
const numberRegex = /[0-9]/;
const specialCharacterRegex = /[^A-Za-z0-9]/;


// ============================================================
// VALIDATION FUNCTION
// ============================================================

const validateStudentForm = (formData, editingStudent) => {

    const errors = {};

    const registrationNo =
        formData.registrationNo.trim();

    const firstName =
        formData.firstName.trim();

    const lastName =
        formData.lastName.trim();

    const email =
        formData.email.trim();

    const phoneNumber =
        formData.phoneNumber.trim();

    const password =
        formData.password;


    // --------------------------------------------------------
    // Registration Number
    // --------------------------------------------------------

    if (!registrationNo) {

        errors.registrationNo =
            "Registration number is required.";

    } else if (!registrationNumberRegex.test(registrationNo)) {

        errors.registrationNo =
            "Registration number contains invalid characters.";

    }


    // --------------------------------------------------------
    // First Name
    // --------------------------------------------------------

    if (!firstName) {

        errors.firstName =
            "First name is required.";

    } else if (firstName.length < 3) {

        errors.firstName =
            "First name must contain at least 3 characters.";

    } else if (!nameRegex.test(firstName)) {

        errors.firstName =
            "First name can contain only valid alphabetic characters.";

    }


    // --------------------------------------------------------
    // Last Name
    // --------------------------------------------------------

    if (!lastName) {

        errors.lastName =
            "Last name is required.";

    } else if (lastName.length < 3) {

        errors.lastName =
            "Last name must contain at least 3 characters.";

    } else if (!nameRegex.test(lastName)) {

        errors.lastName =
            "Last name can contain only valid alphabetic characters.";

    }


    // --------------------------------------------------------
    // Email
    // --------------------------------------------------------

    if (!email) {

        errors.email =
            "Email address is required.";

    } else if (!emailRegex.test(email)) {

        errors.email =
            "Please enter a valid email address.";

    }


    // --------------------------------------------------------
    // Phone Number
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // Password
    // Password validation is required only when creating.
    // --------------------------------------------------------

    if (!editingStudent) {

        if (!password) {

            errors.password =
                "Password is required for a new student.";

        } else {

            if (password.length < 8) {

                errors.password =
                    "Password must contain at least 8 characters.";

            } else if (!uppercaseRegex.test(password)) {

                errors.password =
                    "Password must contain at least one uppercase letter.";

            } else if (!lowercaseRegex.test(password)) {

                errors.password =
                    "Password must contain at least one lowercase letter.";

            } else if (!numberRegex.test(password)) {

                errors.password =
                    "Password must contain at least one number.";

            } else if (!specialCharacterRegex.test(password)) {

                errors.password =
                    "Password must contain at least one special character.";

            }

        }

    }


    return errors;
};


// ============================================================
// STUDENT FORM MODAL
// ============================================================

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


    const [formLoading, setFormLoading] =
        useState(false);

    const [formError, setFormError] =
        useState("");

    const [fieldErrors, setFieldErrors] =
        useState({});


    // ========================================================
    // RESET FORM
    // ========================================================

    useEffect(() => {

        if (!show) return;


        if (editingStudent) {

            setFormData({
                registrationNo:
                    editingStudent.registration_no || "",

                firstName:
                    editingStudent.first_name || "",

                lastName:
                    editingStudent.last_name || "",

                email:
                    editingStudent.email || "",

                phoneNumber:
                    editingStudent.phone_number || "",

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

    }, [editingStudent, show]);


    // ========================================================
    // HANDLE INPUT CHANGE
    // ========================================================

    const handleInputChange = (event) => {

        const {
            name,
            value
        } = event.target;


        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));


        // Clear field error when user starts correcting it
        setFieldErrors((previous) => ({
            ...previous,
            [name]: ""
        }));


        setFormError("");
    };


    // ========================================================
    // CLOSE FORM
    // ========================================================

    const handleClose = () => {

        setFormError("");
        setFieldErrors({});

        onClose();
    };


    // ========================================================
    // HANDLE SUBMIT
    // ========================================================

    const handleSubmit = async (event) => {

        event.preventDefault();


        setFormError("");
        setFieldErrors({});


        // ----------------------------------------------------
        // CLIENT-SIDE VALIDATION
        // ----------------------------------------------------

        const errors =
            validateStudentForm(
                formData,
                editingStudent
            );


        if (Object.keys(errors).length > 0) {

            setFieldErrors(errors);

            setFormError(
                "Please correct the highlighted fields before submitting."
            );

            return;
        }


        try {

            setFormLoading(true);


            // =================================================
            // EDIT STUDENT
            // =================================================

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


            // =================================================
            // ADD STUDENT
            // =================================================

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


            // Successful operation
            onSuccess();

            handleClose();


        } catch (error) {

            console.error(
                "Student save error:",
                error
            );


            // Authentication failure
            if (error.status === 401) {

                onAuthError();

                return;
            }


            // Authorization failure
            if (error.status === 403) {

                setFormError(
                    "You do not have permission to modify students."
                );

                return;
            }


            // Backend validation / duplicate errors
            setFormError(
                error.message ||
                "Failed to save student."
            );


        } finally {

            setFormLoading(false);
        }
    };


    // ========================================================
    // HIDE MODAL
    // ========================================================

    if (!show) return null;


    // ========================================================
    // UI
    // ========================================================

    return (

        <div
            className="modal-overlay"
            onClick={handleClose}
        >

            <div
                className="modal-content student-form-card"
                onClick={(e) =>
                    e.stopPropagation()
                }
            >

                {/* Header */}

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
                            required
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
                            required
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
                            required
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
                            required
                            maxLength="10"
                            inputMode="numeric"
                            placeholder="0712345678"
                        />

                        {fieldErrors.phoneNumber && (

                            <small className="field-error">
                                {fieldErrors.phoneNumber}
                            </small>

                        )}

                    </div>


                    {/* Password - ADD ONLY */}

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
                                minLength="8"
                                autoComplete="new-password"
                            />

                            {fieldErrors.password && (

                                <small className="field-error">
                                    {fieldErrors.password}
                                </small>

                            )}

                            <small className="password-hint">
                                Minimum 8 characters with uppercase,
                                lowercase, number, and special character.
                            </small>

                        </div>

                    )}


                    {/* Actions */}

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