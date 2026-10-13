
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

    // Show / Hide Password state
    const [showPassword, setShowPassword] = useState(false);


    // INITIALIZE FORM
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

        // Always hide password when opening the modal
        setShowPassword(false);

    }, [editingStudent, show]);


    // HANDLE INPUT CHANGES
    const handleInputChange = (event) => {

        const { name, value } = event.target;

        if (name === "phoneNumber") {

            const digitsOnly = value.replace(/\D/g, "");

            if (digitsOnly.length <= 10) {

                setFormData((previous) => ({
                    ...previous,
                    phoneNumber: digitsOnly
                }));

            }

            return;
        }

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

    };


    // CLOSE FORM
    const handleClose = () => {

        setFormError("");
        setShowPassword(false);

        onClose();

    };


    // VALIDATE FORM
    const validateForm = () => {

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


        if (!registrationNo) {
            return "Registration number is required.";
        }


        if (!firstName) {
            return "First name is required.";
        }

        if (firstName.length < 3) {
            return "First name must contain at least 3 characters.";
        }

        if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(firstName)) {
            return "First name must contain only letters.";
        }


        if (!lastName) {
            return "Last name is required.";
        }

        if (lastName.length < 3) {
            return "Last name must contain at least 3 characters.";
        }

        if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(lastName)) {
            return "Last name must contain only letters.";
        }


        if (!email) {
            return "Email address is required.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return "Please enter a valid email address.";
        }


        if (!phoneNumber) {
            return "Phone number is required.";
        }

        if (!/^\d+$/.test(phoneNumber)) {
            return "Phone number must contain only digits.";
        }

        if (phoneNumber.length !== 10) {
            return "Phone number must contain exactly 10 digits.";
        }


        // Password validation only for a new student
        if (!editingStudent) {

            if (!password) {
                return "Password is required for a new student.";
            }

            if (password.length < 8) {
                return "Password must be at least 8 characters.";
            }

            if (!/[A-Z]/.test(password)) {
                return "Password must contain at least one uppercase letter.";
            }

            if (!/[a-z]/.test(password)) {
                return "Password must contain at least one lowercase letter.";
            }

            if (!/\d/.test(password)) {
                return "Password must contain at least one number.";
            }

            if (!/[@$!%*?&]/.test(password)) {
                return "Password must contain at least one special character.";
            }

        }

        return null;

    };


    // SUBMIT FORM
    const handleSubmit = async (event) => {

        event.preventDefault();

        setFormError("");

        const validationError = validateForm();

        if (validationError) {

            setFormError(validationError);
            return;

        }

        try {

            setFormLoading(true);

            if (editingStudent) {

                // UPDATE EXISTING STUDENT
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

                // CREATE NEW STUDENT
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


    return (

        <div
            className="modal-overlay"
            onClick={handleClose}
        >

            <div
                className="modal-content student-form-card"
                onClick={(event) => event.stopPropagation()}
            >

                {/* FORM HEADER */}
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
                        aria-label="Close form"
                    >
                        ×
                    </button>

                </div>


                {/* ERROR MESSAGE */}
                {formError && (

                    <div className="dashboard-error">
                        {formError}
                    </div>

                )}


                {/* STUDENT FORM */}
                <form
                    className="student-form"
                    onSubmit={handleSubmit}
                >

                    {/* REGISTRATION NUMBER */}
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

                    </div>


                    {/* FIRST NAME */}
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
                            minLength={3}
                            required
                        />

                    </div>


                    {/* LAST NAME */}
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
                            minLength={3}
                            required
                        />

                    </div>


                    {/* EMAIL */}
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

                    </div>


                    {/* PHONE NUMBER */}
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
                            maxLength={10}
                            inputMode="numeric"
                            required
                        />

                    </div>


                    {/* PASSWORD - NEW STUDENT ONLY */}
                    {!editingStudent && (

                        <div className="form-group">

                            <label htmlFor="student-password">
                                Password
                            </label>

                            <div className="password-input-wrapper">

                                <input
                                    id="student-password"
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
                                    minLength={8}
                                    autoComplete="new-password"
                                    required
                                />

                                {/* SHOW / HIDE BUTTON */}
                                <button
                                    type="button"
                                    className="password-toggle-button"
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

                                        /* EYE-SLASH ICON */
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="21"
                                            height="21"
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
                                            <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7a12 12 0 0 1-3 4.1" />
                                            <path d="M6.6 6.6A13 13 0 0 0 2.5 12c1 2.5 4.5 7 9.5 7 1.3 0 2.5-.3 3.6-.8" />
                                        </svg>

                                    ) : (

                                        /* EYE ICON */
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="21"
                                            height="21"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>

                                    )}

                                </button>

                            </div>

                        </div>

                    )}


                    {/* FORM ACTIONS */}
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

