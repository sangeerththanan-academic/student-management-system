import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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

        if (!formData.registrationNo.trim()) {
            setFormError("Registration Number is required.");
            return;
        }

        if (!formData.firstName.trim()) {
            setFormError("First Name is required.");
            return;
        }
        if (formData.firstName.trim().length < 3) {
            setFormError("First Name must contain at least 3 characters.");
            return;
        }
        if (!/^[A-Za-z]+$/.test(formData.firstName.trim())) {
            setFormError("First Name must contain valid alphabetic characters only.");
            return;
        }

        if (!formData.lastName.trim()) {
            setFormError("Last Name is required.");
            return;
        }
        if (formData.lastName.trim().length < 3) {
            setFormError("Last Name must contain at least 3 characters.");
            return;
        }
        if (!/^[A-Za-z]+$/.test(formData.lastName.trim())) {
            setFormError("Last Name must contain valid alphabetic characters only.");
            return;
        }

        if (!formData.email.trim()) {
            setFormError("Email is required.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            setFormError("Email must follow a valid email format.");
            return;
        }

        if (!formData.phoneNumber.trim()) {
            setFormError("Phone Number is required.");
            return;
        }
        if (!/^\d+$/.test(formData.phoneNumber.trim())) {
            setFormError("Phone Number must contain numeric characters only.");
            return;
        }
        if (formData.phoneNumber.trim().length < 10) {
            setFormError("Phone Number cannot contain fewer than 10 digits.");
            return;
        }
        if (formData.phoneNumber.trim().length > 10) {
            setFormError("Phone Number cannot contain more than 10 digits.");
            return;
        }

        // Password is required only when creating
        if (!editingStudent) {
            if (!formData.password) {
                setFormError("Password is required for a new student.");
                return;
            }
            if (formData.password.length < 8) {
                setFormError("Password must contain at least 8 characters.");
                return;
            }
            if (!/[A-Z]/.test(formData.password)) {
                setFormError("Password must contain at least one uppercase letter.");
                return;
            }
            if (!/[a-z]/.test(formData.password)) {
                setFormError("Password must contain at least one lowercase letter.");
                return;
            }
            if (!/[0-9]/.test(formData.password)) {
                setFormError("Password must contain at least one number.");
                return;
            }
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
                setFormError("Password must contain at least one special character.");
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
                            registrationNo: formData.registrationNo.trim(),
                            firstName: formData.firstName.trim(),
                            lastName: formData.lastName.trim(),
                            email: formData.email.trim(),
                            phoneNumber: formData.phoneNumber.trim()
                        })
                    }
                );
            } else {
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
                        required
                    />
                </div>


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
                    />
                </div>


                {!editingStudent && (
                    <div className="form-group">
                        <label>
                            Password
                        </label>

                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                disabled={formLoading}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                aria-pressed={showPassword}
                                disabled={formLoading}
                            >
                                {showPassword ? (
                                    <EyeOff size={20} strokeWidth={2} />
                                ) : (
                                    <Eye size={20} strokeWidth={2} />
                                )}
                            </button>
                        </div>
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