import { useEffect, useState } from "react";

import apiRequest from "../services/api";

const registrationNumberPattern = /^[A-Za-z0-9]{3,50}$/;
const namePattern = /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordSpecialCharacterPattern = /[^A-Za-z0-9\s]/;

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


    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");

        const registrationNo = formData.registrationNo.trim();
        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim();
        const phoneNumber = formData.phoneNumber.trim();

        if (
            !registrationNo ||
            !firstName ||
            !lastName ||
            !email ||
            !phoneNumber
        ) {
            setFormError("All student fields are required.");
            return;
        }

        if (!registrationNumberPattern.test(registrationNo)) {
            setFormError("Registration number must be 3-50 letters or numbers, with no spaces or special characters.");
            return;
        }

        if (firstName.length < 3 || firstName.length > 100 || !namePattern.test(firstName)) {
            setFormError("First name must contain at least 3 characters and use only letters, spaces, hyphens, or apostrophes.");
            return;
        }

        if (lastName.length < 3 || lastName.length > 100 || !namePattern.test(lastName)) {
            setFormError("Last name must contain at least 3 characters and use only letters, spaces, hyphens, or apostrophes.");
            return;
        }

        if (!emailPattern.test(email) || email.length > 150) {
            setFormError("Enter a valid email address (maximum 150 characters).");
            return;
        }

        if (!/^\d{10}$/.test(phoneNumber)) {
            setFormError("Phone number must contain exactly 10 digits.");
            return;
        }

        // Password is required only when creating
        if (!editingStudent) {
            const password = formData.password;

            if (
                password.length < 8 ||
                !/[A-Z]/.test(password) ||
                !/[a-z]/.test(password) ||
                !/\d/.test(password) ||
                !passwordSpecialCharacterPattern.test(password)
            ) {
                setFormError("Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.");
                return;
            }
        }

        try {
            setFormLoading(true);

            if (editingStudent) {
                await apiRequest(
                    `/api/students/${editingStudent.student_id}`,
                    {
                        method: "PUT",
                        body: JSON.stringify({
                            registrationNo,
                            firstName,
                            lastName,
                            email,
                            phoneNumber
                        })
                    }
                );
            } else {
                await apiRequest(
                    "/api/students/",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            registrationNo,
                            firstName,
                            lastName,
                            email,
                            phoneNumber,
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
        <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content student-form-card" onClick={(e) => e.stopPropagation()}>

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
                noValidate
            >

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
                        minLength={3}
                        maxLength={50}
                        pattern="[A-Za-z0-9]{3,50}"
                        required
                    />
                </div>


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
                        minLength={3}
                        maxLength={100}
                        required
                    />
                </div>


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
                        minLength={3}
                        maxLength={100}
                        required
                    />
                </div>


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
                        maxLength={150}
                        required
                    />
                </div>


                <div className="form-group">
                    <label>
                        Phone Number
                    </label>

                    <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        disabled={formLoading}
                        inputMode="numeric"
                        maxLength={10}
                        required
                    />
                </div>


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
                            minLength={8}
                            required
                        />
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