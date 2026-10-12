
import { useEffect, useState } from "react";
import apiRequest, { API_BASE_URL } from "../services/api";

const registrationNumberRegex = /^[A-Za-z0-9]+(?:[-/][A-Za-z0-9]+)*$/;
const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;
const uppercaseRegex = /[A-Z]/;
const lowercaseRegex = /[a-z]/;
const numberRegex = /[0-9]/;
const specialCharacterRegex = /[^A-Za-z0-9]/;

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];

const validateStudentForm = (formData, editingStudent) => {
    const errors = {};

    const registrationNo = formData.registrationNo.trim();
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim();
    const phoneNumber = formData.phoneNumber.trim();
    const password = formData.password;

    if (!registrationNo) {
        errors.registrationNo = "Registration number is required.";
    } else if (!registrationNumberRegex.test(registrationNo)) {
        errors.registrationNo =
            "Registration number contains invalid characters.";
    }

    if (!firstName) {
        errors.firstName = "First name is required.";
    } else if (firstName.length < 3) {
        errors.firstName =
            "First name must contain at least 3 characters.";
    } else if (!nameRegex.test(firstName)) {
        errors.firstName =
            "First name can contain only valid alphabetic characters.";
    }

    if (!lastName) {
        errors.lastName = "Last name is required.";
    } else if (lastName.length < 3) {
        errors.lastName =
            "Last name must contain at least 3 characters.";
    } else if (!nameRegex.test(lastName)) {
        errors.lastName =
            "Last name can contain only valid alphabetic characters.";
    }

    if (!email) {
        errors.email = "Email address is required.";
    } else if (!emailRegex.test(email)) {
        errors.email = "Please enter a valid email address.";
    }

    if (!phoneNumber) {
        errors.phoneNumber = "Phone number is required.";
    } else if (!/^\d+$/.test(phoneNumber)) {
        errors.phoneNumber =
            "Phone number must contain numeric characters only.";
    } else if (!phoneRegex.test(phoneNumber)) {
        errors.phoneNumber = "Phone number must contain exactly 10 digits.";
    }

    if (!editingStudent) {
        if (!password) {
            errors.password = "Password is required for a new student.";
        } else if (password.length < 8) {
            errors.password = "Password must contain at least 8 characters.";
        } else if (!uppercaseRegex.test(password)) {
            errors.password =
                "Password must contain at least one uppercase letter.";
        } else if (!lowercaseRegex.test(password)) {
            errors.password =
                "Password must contain at least one lowercase letter.";
        } else if (!numberRegex.test(password)) {
            errors.password = "Password must contain at least one number.";
        } else if (!specialCharacterRegex.test(password)) {
            errors.password =
                "Password must contain at least one special character.";
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
    const emptyForm = {
        registrationNo: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: ""
    };

    const [formData, setFormData] = useState(emptyForm);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [imageError, setImageError] = useState("");
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

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

            setImagePreview(editingStudent.profile_photo
                ? `${API_BASE_URL}${editingStudent.profile_photo}`
                : "");
        } else {
            setFormData(emptyForm);
            setImagePreview("");
        }

        setSelectedImage(null);
        setImageError("");
        setFormError("");
        setFieldErrors({});
    }, [editingStudent, show]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        setFieldErrors((previous) => ({
            ...previous,
            [name]: ""
        }));

        setFormError("");
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        setImageError("");
        setSelectedImage(null);

        if (!file) {
            setImagePreview(
                editingStudent?.profile_photo
                    ? `${API_BASE_URL}${editingStudent.profile_photo}`
                    : ""
            );
            return;
        }

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setImageError("Only PNG, JPG, and JPEG images are allowed.");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setImageError("Profile image must be 2 MB or smaller.");
            event.target.value = "";
            return;
        }

        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleClose = () => {
        if (formLoading) return;

        setFormError("");
        setFieldErrors({});
        setImageError("");
        setSelectedImage(null);
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");
        setFieldErrors({});

        const errors = validateStudentForm(formData, editingStudent);

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setFormError(
                "Please correct the highlighted fields before submitting."
            );
            return;
        }

        try {
            setFormLoading(true);

            const payload = new FormData();

            payload.append("registrationNo", formData.registrationNo.trim());
            payload.append("firstName", formData.firstName.trim());
            payload.append("lastName", formData.lastName.trim());
            payload.append("email", formData.email.trim());
            payload.append("phoneNumber", formData.phoneNumber.trim());

            if (!editingStudent) {
                payload.append("password", formData.password);
            }

            if (selectedImage) {
                payload.append("profileImage", selectedImage);
            }

            if (editingStudent) {
                await apiRequest(
                    `/api/students/${editingStudent.student_id}`,
                    {
                        method: "PUT",
                        body: payload
                    }
                );
            } else {
                await apiRequest("/api/students/", {
                    method: "POST",
                    body: payload
                });
            }

            await onSuccess();
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

            if (error.data?.errors) {
                setFieldErrors(error.data.errors);
            }

            setFormError(error.message || "Failed to save student.");
        } finally {
            setFormLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div
                className="modal-content student-form-card"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="form-card-header">
                    <div>
                        <h3>{editingStudent ? "Edit Student" : "Add New Student"}</h3>
                        <p>
                            {editingStudent
                                ? "Update student information and profile image."
                                : "Create a student account and upload a profile image."}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="close-form-button"
                        onClick={handleClose}
                        disabled={formLoading}
                        aria-label="Close form"
                    >
                        ×
                    </button>
                </div>

                {formError && (
                    <div className="dashboard-error" role="alert">
                        {formError}
                    </div>
                )}

                <form className="student-form" onSubmit={handleSubmit}>
                    <div className="form-group profile-image-group">
                        <label htmlFor="profileImage">Profile Image</label>

                        {imagePreview ? (
                            <img
                                className="profile-image-preview"
                                src={imagePreview}
                                alt="Student profile preview"
                                onError={() => setImagePreview("")}
                            />
                        ) : (
                            <div className="profile-image-placeholder">
                                No image selected
                            </div>
                        )}

                        <input
                            id="profileImage"
                            name="profileImage"
                            type="file"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            onChange={handleImageChange}
                            disabled={formLoading}
                        />

                        <small className="password-hint">
                            PNG, JPG, or JPEG. Maximum size: 2 MB.
                            {editingStudent
                                ? " Leave this field unchanged to keep the current image."
                                : ""}
                        </small>

                        {imageError && (
                            <small className="field-error" role="alert">
                                {imageError}
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="registrationNo">Registration Number</label>
                        <input
                            id="registrationNo"
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

                    <div className="form-group">
                        <label htmlFor="firstName">First Name</label>
                        <input
                            id="firstName"
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

                    <div className="form-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                            id="lastName"
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

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
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

                    <div className="form-group">
                        <label htmlFor="phoneNumber">Phone Number</label>
                        <input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="text"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                            maxLength={10}
                            inputMode="numeric"
                            placeholder="0712345678"
                        />
                        {fieldErrors.phoneNumber && (
                            <small className="field-error">
                                {fieldErrors.phoneNumber}
                            </small>
                        )}
                    </div>

                    {!editingStudent && (
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                disabled={formLoading}
                                required
                                minLength={8}
                                autoComplete="new-password"
                            />
                            {fieldErrors.password && (
                                <small className="field-error">
                                    {fieldErrors.password}
                                </small>
                            )}
                            <small className="password-hint">
                                Minimum 8 characters with uppercase, lowercase,
                                number, and special character.
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
                            disabled={formLoading || Boolean(imageError)}
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