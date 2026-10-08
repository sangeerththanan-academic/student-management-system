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
    }, [editingStudent, show]);


    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };


    const handleClose = () => {
        setFormError("");
        onClose();
    };


    // CR-004 VALIDATION
    const validateStudentForm = () => {

        const registrationNo = formData.registrationNo.trim();
        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim();
        const phoneNumber = formData.phoneNumber.trim();
        const password = formData.password;


        // Required fields
        if (
            !registrationNo ||
            !firstName ||
            !lastName ||
            !email ||
            !phoneNumber
        ) {
            return "All student fields are required.";
        }


        // Registration number
        if (!/^[A-Za-z0-9]+$/.test(registrationNo)) {
            return "Registration number can contain only letters and numbers.";
        }


        // First name minimum length
        if (firstName.length < 3) {
            return "First name must contain at least 3 characters.";
        }


        // Last name minimum length
        if (lastName.length < 3) {
            return "Last name must contain at least 3 characters.";
        }


        // Name validation
        const namePattern = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;

        if (!namePattern.test(firstName)) {
            return "First name can contain only alphabetic characters.";
        }

        if (!namePattern.test(lastName)) {
            return "Last name can contain only alphabetic characters.";
        }


        // Email validation
        const emailPattern =
            /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        if (!emailPattern.test(email)) {
            return "Please enter a valid email address.";
        }


        // Phone validation
        if (!/^\d+$/.test(phoneNumber)) {
            return "Phone number must contain numeric characters only.";
        }

        if (phoneNumber.length < 10) {
            return "Phone number must contain exactly 10 digits.";
        }

        if (phoneNumber.length > 10) {
            return "Phone number must contain exactly 10 digits.";
        }


        // Password validation only for new students
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

        return "";
    };


    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");


        // CR-004 client-side validation
        const validationError = validateStudentForm();

        if (validationError) {
            setFormError(validationError);
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
                            registrationNo: formData.registrationNo.trim(),
                            firstName: formData.firstName.trim(),
                            lastName: formData.lastName.trim(),
                            email: formData.email.trim(),
                            phoneNumber: formData.phoneNumber.trim()
                        })
                    }
                );

            }

            // ADD STUDENT
            else {

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
                            maxLength={10}
                            inputMode="numeric"
                            required
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