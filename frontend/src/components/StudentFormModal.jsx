
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

    // ============================================================
    // Reset form when editingStudent changes or modal opens
    // ============================================================

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

    }, [editingStudent, show]);


    // ============================================================
    // Input Change
    // ============================================================

    const handleInputChange = (event) => {

        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

    };


    // ============================================================
    // Client-Side Validation
    // ============================================================

    const validateForm = () => {

        const registrationNo = formData.registrationNo.trim();
        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim();
        const phoneNumber = formData.phoneNumber.trim();
        const password = formData.password;


        // --------------------------------------------------------
        // Required fields
        // --------------------------------------------------------

        if (!registrationNo) {
            return "Registration number is required.";
        }

        if (!firstName) {
            return "First name is required.";
        }

        if (!lastName) {
            return "Last name is required.";
        }

        if (!email) {
            return "Email address is required.";
        }

        if (!phoneNumber) {
            return "Phone number is required.";
        }


        // --------------------------------------------------------
        // Registration Number
        // --------------------------------------------------------

        // Allows letters, numbers, / and -
        // Example: JF/ICT/24/10
        const registrationPattern = /^[A-Za-z0-9/-]+$/;

        if (!registrationPattern.test(registrationNo)) {
            return "Registration number contains invalid characters.";
        }


        // --------------------------------------------------------
        // First Name
        // --------------------------------------------------------

        if (firstName.length < 3) {
            return "First name must contain at least 3 characters.";
        }

        const namePattern = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

        if (!namePattern.test(firstName)) {
            return "First name can contain alphabetic characters only.";
        }


        // --------------------------------------------------------
        // Last Name
        // --------------------------------------------------------

        if (lastName.length < 3) {
            return "Last name must contain at least 3 characters.";
        }

        if (!namePattern.test(lastName)) {
            return "Last name can contain alphabetic characters only.";
        }


        // --------------------------------------------------------
        // Email
        // --------------------------------------------------------

        const emailPattern =
            /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        if (!emailPattern.test(email)) {
            return "Please enter a valid email address.";
        }


        // --------------------------------------------------------
        // Phone Number
        // --------------------------------------------------------

        if (!/^\d+$/.test(phoneNumber)) {
            return "Phone number must contain numeric characters only.";
        }

        if (phoneNumber.length !== 10) {
            return "Phone number must contain exactly 10 digits.";
        }


        // --------------------------------------------------------
        // Password
        // Password required only for new students
        // --------------------------------------------------------

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


        // --------------------------------------------------------
        // All validation passed
        // --------------------------------------------------------

        return "";

    };


    // ============================================================
    // Close Modal
    // ============================================================

    const handleClose = () => {

        setFormError("");

        onClose();
    };


    // ============================================================
    // Submit Form
    // ============================================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setFormError("");


        // --------------------------------------------------------
        // Client-side validation
        // --------------------------------------------------------

        const validationError = validateForm();

        if (validationError) {

            setFormError(validationError);

            return;
        }


        try {

            setFormLoading(true);


            // ====================================================
            // EDIT STUDENT
            // ====================================================

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

            }

            // ====================================================
            // CREATE STUDENT
            // ====================================================

            else {

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


            // ====================================================
            // Success
            // ====================================================

            onSuccess();

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


            // Backend validation / other errors
            setFormError(
                error.message || "Failed to save student."
            );


        } finally {

            setFormLoading(false);

        }
    };


    // ============================================================
    // Do not display modal
    // ============================================================

    if (!show) return null;


    // ============================================================
    // UI
    // ============================================================

    return (

        <div
            className="modal-overlay"
            onClick={handleClose}
        >

            <div
                className="modal-content student-form-card"
                onClick={(e) => e.stopPropagation()}
            >

                {/* ==================================================
                    HEADER
                ================================================== */}

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


                {/* ==================================================
                    VALIDATION / ERROR MESSAGE
                ================================================== */}

                {formError && (

                    <div className="dashboard-error">

                        {formError}

                    </div>
                )}


                {/* ==================================================
                    FORM
                ================================================== */}

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
                            maxLength={10}
                            inputMode="numeric"
                        />

                    </div>


                    {/* Password - Add only */}

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

                            <small>
                                Minimum 8 characters with uppercase,
                                lowercase, number and special character.
                            </small>

                        </div>
                    )}


                    {/* ==================================================
                        FORM ACTIONS
                    ================================================== */}

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
