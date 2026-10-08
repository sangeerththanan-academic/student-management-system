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

    // =====================================================
    // RESET FORM
    // =====================================================

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
    }, [editingStudent, show]);

    // =====================================================
    // HANDLE INPUT CHANGE
    // =====================================================

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

    // =====================================================
    // CLOSE
    // =====================================================

    const handleClose = () => {
        if (formLoading) return;

        setFormError("");
        onClose();
    };

    // =====================================================
    // VALIDATION
    // =====================================================

    const validateForm = () => {
        const registrationNo =
            String(formData.registrationNo || "").trim();

        const firstName =
            String(formData.firstName || "").trim();

        const lastName =
            String(formData.lastName || "").trim();

        const email =
            String(formData.email || "").trim();

        const phoneNumber =
            String(formData.phoneNumber || "").trim();

        const password =
            String(formData.password || "");

        // Registration number
        if (!registrationNo) {
            return "Registration number is required.";
        }

        // First name
        if (!firstName) {
            return "First name is required.";
        }

        if (firstName.length < 3) {
            return "First name must contain at least 3 characters.";
        }

        if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(firstName)) {
            return "First name must contain only letters and spaces.";
        }

        // Last name
        if (!lastName) {
            return "Last name is required.";
        }

        if (lastName.length < 3) {
            return "Last name must contain at least 3 characters.";
        }

        if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(lastName)) {
            return "Last name must contain only letters and spaces.";
        }

        // Email
        if (!email) {
            return "Email address is required.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return "Please enter a valid email address.";
        }

        // Phone
        if (!phoneNumber) {
            return "Phone number is required.";
        }

        if (!/^\d+$/.test(phoneNumber)) {
            return "Phone number must contain only digits.";
        }

        if (phoneNumber.length !== 10) {
            return "Phone number must contain exactly 10 digits.";
        }

        // Password only for new student
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

    // =====================================================
    // SUBMIT
    // =====================================================

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

            const commonData = {
                registrationNo:
                    formData.registrationNo.trim(),

                firstName:
                    formData.firstName.trim(),

                lastName:
                    formData.lastName.trim(),

                email:
                    formData.email.trim().toLowerCase(),

                phoneNumber:
                    formData.phoneNumber.trim()
            };

            // =================================================
            // UPDATE
            // =================================================

            if (editingStudent) {
                await apiRequest(
                    `/api/students/${editingStudent.student_id}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(commonData)
                    }
                );
            }

            // =================================================
            // CREATE
            // =================================================

            else {
                await apiRequest(
                    "/api/students/",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            ...commonData,
                            password: formData.password
                        })
                    }
                );
            }

            onSuccess();
            onClose();

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
                error.message ||
                "Failed to save student."
            );

        } finally {
            setFormLoading(false);
        }
    };

    // =====================================================
    // HIDE MODAL
    // =====================================================

    if (!show) {
        return null;
    }

    // =====================================================
    // UI
    // =====================================================

    return (
        <div
            className="modal-overlay"
            onClick={handleClose}
        >
            <div
                className="modal-content student-form-card"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="form-card-header">
                    <div>
                        <h3>
                            {editingStudent
                                ? "Edit Student"
                                : "Add New Student"}
                        </h3>

                        <p>
                            {editingStudent
                                ? "Update student information."
                                : "Create a new student account."}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="close-form-button"
                        onClick={handleClose}
                        disabled={formLoading}
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
                            minLength={3}
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
                            maxLength={10}
                            inputMode="numeric"
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

                            <small>
                                Minimum 8 characters with
                                uppercase, lowercase, number
                                and special character.
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
                                    : "Create Student"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default StudentFormModal;