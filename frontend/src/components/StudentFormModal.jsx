import { useEffect, useState } from "react";
import apiRequest from "../services/api";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg"];

const getProfileImageUrl = (photo) => {
    if (!photo || typeof photo !== "string") {
        return "";
    }

    const trimmedPhoto = photo.trim();

    if (!trimmedPhoto) {
        return "";
    }

    if (/^https?:\/\//i.test(trimmedPhoto)) {
        return trimmedPhoto;
    }

    const configuredApiUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace(/\/+$/, "");

    const backendBaseUrl = configuredApiUrl.replace(/\/api$/i, "");
    const imagePath = trimmedPhoto
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");

    return `${backendBaseUrl}/${imagePath}`;
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
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    // CR-010: Profile image state
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [imageError, setImageError] = useState("");

    useEffect(() => {
        if (!show) return;

        if (editingStudent) {
            setFormData({
                registrationNo: editingStudent.registration_no || "",
                firstName: editingStudent.first_name || "",
                lastName: editingStudent.last_name || "",
                email: editingStudent.email || "",
                phoneNumber: String(editingStudent.phone_number || ""),
                password: ""
            });

            setImagePreview(
                getProfileImageUrl(editingStudent.profile_photo)
            );
        } else {
            setFormData({ ...emptyForm });
            setImagePreview("");
        }

        setProfileImage(null);
        setImageError("");
        setFormError("");
        setFieldErrors({});
        setShowPassword(false);
    }, [editingStudent, show]);

    // CR-004: Handle text input changes
    const handleInputChange = (event) => {
        const { name, value } = event.target;

        let updatedValue = value;

        if (name === "phoneNumber") {
            updatedValue = value.replace(/\D/g, "").slice(0, 10);
        }

        setFormData((previous) => ({
            ...previous,
            [name]: updatedValue
        }));

        setFieldErrors((previous) => ({
            ...previous,
            [name]: ""
        }));

        setFormError("");
    };

    // CR-010: Validate and preview selected image
    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        setImageError("");
        setFormError("");

        if (!file) {
            return;
        }

        const extension = file.name
            .slice(file.name.lastIndexOf("."))
            .toLowerCase();

        const allowedExtensions = [".png", ".jpg", ".jpeg"];

        if (
            !ALLOWED_IMAGE_TYPES.includes(file.type) ||
            !allowedExtensions.includes(extension)
        ) {
            setProfileImage(null);
            setImageError(
                "Only PNG, JPG and JPEG images are allowed."
            );
            event.target.value = "";
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setProfileImage(null);
            setImageError("Image size must not exceed 2 MB.");
            event.target.value = "";
            return;
        }

        setProfileImage(file);

        setImagePreview(URL.createObjectURL(file));
    };

    // CR-010: Remove selected image
    const handleRemoveImage = () => {
        setProfileImage(null);
        setImageError("");

        setImagePreview(
            editingStudent
                ? getProfileImageUrl(editingStudent.profile_photo)
                : ""
        );

        const fileInput = document.getElementById(
            "student-profile-image"
        );

        if (fileInput) {
            fileInput.value = "";
        }
    };

    // CR-004: Validate student fields
    const validateForm = () => {
        const errors = {};

        const registrationNo = formData.registrationNo.trim();
        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim();
        const phoneNumber = formData.phoneNumber.trim();
        const password = formData.password;

        if (!registrationNo) {
            errors.registrationNo =
                "Registration number is required.";
        } else if (!/^REG\d{3}$/i.test(registrationNo)) {
            errors.registrationNo =
                "Registration number must be in the format REG001.";
        }

        if (!firstName) {
            errors.firstName = "First name is required.";
        } else if (!/^[A-Za-z]{3,}$/.test(firstName)) {
            errors.firstName =
                "First name must contain at least 3 alphabetic characters.";
        }

        if (!lastName) {
            errors.lastName = "Last name is required.";
        } else if (!/^[A-Za-z]{3,}$/.test(lastName)) {
            errors.lastName =
                "Last name must contain at least 3 alphabetic characters.";
        }

        if (!email) {
            errors.email = "Email address is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Please enter a valid email address.";
        }

        if (!phoneNumber) {
            errors.phoneNumber = "Phone number is required.";
        } else if (!/^\d{10}$/.test(phoneNumber)) {
            errors.phoneNumber =
                "Phone number must contain exactly 10 digits.";
        }

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
        if (formLoading) return;

        setFormError("");
        setFieldErrors({});
        setImageError("");
        setProfileImage(null);
        setImagePreview("");

        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");
        setFieldErrors({});

        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            setFormError(
                "Please correct the validation errors before submitting."
            );
            return;
        }

        if (imageError) {
            setFormError("Please select a valid profile image.");
            return;
        }

        try {
            setFormLoading(true);

            // Send fields and optional image as multipart FormData.
            const payload = new FormData();

            payload.append(
                "registrationNo",
                formData.registrationNo.trim()
            );
            payload.append("firstName", formData.firstName.trim());
            payload.append("lastName", formData.lastName.trim());
            payload.append("email", formData.email.trim());
            payload.append(
                "phoneNumber",
                formData.phoneNumber.trim()
            );

            if (!editingStudent) {
                payload.append("password", formData.password);
            }

            if (profileImage) {
                payload.append("profileImage", profileImage);
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

            if (error?.status === 401 || error?.statusCode === 401) {
                if (onAuthError) {
                    onAuthError();
                }
                return;
            }

            if (error?.status === 403 || error?.statusCode === 403) {
                setFormError(
                    error.message ||
                        "Only an administrator can modify student records."
                );
                return;
            }

            setFormError(
                error?.message || "Failed to save student."
            );
        } finally {
            setFormLoading(false);
        }
    };

    if (!show) return null;

    const renderFieldError = (name) =>
        fieldErrors[name] ? (
            <small className="form-error">
                {fieldErrors[name]}
            </small>
        ) : null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div
                className="modal-content student-form-card"
                onClick={(event) => event.stopPropagation()}
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

                <form
                    className="student-form"
                    onSubmit={handleSubmit}
                    noValidate
                >
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
                            placeholder="REG001"
                        />

                        {renderFieldError("registrationNo")}
                    </div>

                    <div className="form-group">
                        <label htmlFor="firstName">First Name</label>

                        <input
                            id="firstName"
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                        />

                        {renderFieldError("firstName")}
                    </div>

                    <div className="form-group">
                        <label htmlFor="lastName">Last Name</label>

                        <input
                            id="lastName"
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                        />

                        {renderFieldError("lastName")}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>

                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                        />

                        {renderFieldError("email")}
                    </div>

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
                            inputMode="numeric"
                            maxLength={10}
                        />

                        {renderFieldError("phoneNumber")}
                    </div>

                    {!editingStudent && (
                        <div className="form-group">
                            <label htmlFor="student-password">
                                Password
                            </label>

                            <div className="password-input-wrapper">
                                <input
                                    id="student-password"
                                    type={
                                        showPassword ? "text" : "password"
                                    }
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    disabled={formLoading}
                                    required
                                    autoComplete="new-password"
                                    aria-describedby="student-password-hint"
                                />

                                <button
                                    type="button"
                                    className="password-toggle-button"
                                    onClick={() =>
                                        setShowPassword(
                                            (previous) => !previous
                                        )
                                    }
                                    disabled={formLoading}
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? (
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M3 3l18 18" />
                                            <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                                            <path d="M9.88 5.09A9.77 9.77 0 0 1 12 4.75c5 0 8.5 5.25 8.5 5.25a16.6 16.6 0 0 1-3.09 3.46" />
                                            <path d="M6.61 6.61C4.13 8.24 3.5 10 3.5 10S7 15.25 12 15.25c1.06 0 2.04-.18 2.93-.49" />
                                        </svg>
                                    ) : (
                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            <small
                                id="student-password-hint"
                                className="field-hint"
                            >
                                Use at least 8 characters with uppercase,
                                lowercase, a number, and a special character.
                            </small>

                            {renderFieldError("password")}
                        </div>
                    )}

                    {/* CR-010: Profile image upload */}
                    <div className="form-group">
                        <label htmlFor="student-profile-image">
                            Profile Image
                        </label>

                        {imagePreview && (
                            <div className="profile-image-preview">
                                <img
                                    src={imagePreview}
                                    alt="Student profile preview"
                                    onError={(event) => {
                                        event.currentTarget.style.display =
                                            "none";
                                    }}
                                />
                            </div>
                        )}

                        <input
                            id="student-profile-image"
                            type="file"
                            name="profileImage"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            onChange={handleImageChange}
                            disabled={formLoading}
                        />

                        <small className="field-hint">
                            PNG, JPG or JPEG only. Maximum file size: 2 MB.
                            {editingStudent
                                ? " Choose a new image only if you want to replace the current one."
                                : ""}
                        </small>

                        {imageError && (
                            <small className="form-error" role="alert">
                                {imageError}
                            </small>
                        )}

                        {(profileImage || imagePreview) && (
                            <button
                                type="button"
                                className="cancel-button remove-image-button"
                                onClick={handleRemoveImage}
                                disabled={formLoading}
                            >
                                {profileImage
                                    ? "Remove selected image"
                                    : "Remove image"}
                            </button>
                        )}
                    </div>

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
                            className="submit-button"
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
