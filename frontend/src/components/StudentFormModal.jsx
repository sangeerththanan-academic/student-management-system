import { useEffect, useState } from "react";
import apiRequest from "../services/api";

const API_BASE_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const getProfileImageUrl = (image) => {
    if (!image) return "";

    const value = String(image).replace(/\\/g, "/");

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    const filename = value.split("/").filter(Boolean).pop();

    return filename
        ? `${API_BASE_URL}/uploads/students/${encodeURIComponent(filename)}`
        : "";
};

const validateStudent = (data, isEditing) => {
    const errors = {};

    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{5,20}$/.test(data.registrationNo.trim())) {
        errors.registrationNo =
            "Enter 5–20 letters and numbers, e.g. REG009.";
    }

    if (!/^[A-Za-z]{3,}$/.test(data.firstName.trim())) {
        errors.firstName = "First name must contain at least 3 English letters.";
    }

    if (!/^[A-Za-z]{3,}$/.test(data.lastName.trim())) {
        errors.lastName = "Last name must contain at least 3 English letters.";
    }

    if (!/^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(data.email.trim())) {
        errors.email = "Enter a valid Gmail address ending in @gmail.com.";
    }

    if (!/^\d{10}$/.test(data.phoneNumber.trim())) {
        errors.phoneNumber = "Phone number must contain exactly 10 digits.";
    }

    if (!isEditing || data.password) {
        if (data.password.length < 8) {
            errors.password = "Password must contain at least 8 characters.";
        } else if (!/[A-Z]/.test(data.password)) {
            errors.password = "Include at least one uppercase letter.";
        } else if (!/[a-z]/.test(data.password)) {
            errors.password = "Include at least one lowercase letter.";
        } else if (!/\d/.test(data.password)) {
            errors.password = "Include at least one number.";
        } else if (!/[^A-Za-z0-9]/.test(data.password)) {
            errors.password = "Include at least one special character.";
        }
    }

    return errors;
};

const EyeIcon = ({ hidden }) => (
    <svg
        viewBox="0 0 24 24"
        width="21"
        height="21"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {hidden ? (
            <>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
            </>
        ) : (
            <>
                <path d="M3 3l18 18" />
                <path d="M2 12s3.5-7 10-7c2 0 3.8.7 5.3 1.7" />
                <path d="M22 12s-3.5 7-10 7c-2 0-3.8-.7-5.3-1.7" />
            </>
        )}
    </svg>
);

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

    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [imageError, setImageError] = useState("");
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [formLoading, setFormLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!show) return;

        setFormData({
            registrationNo: editingStudent?.registration_no || "",
            firstName: editingStudent?.first_name || "",
            lastName: editingStudent?.last_name || "",
            email: editingStudent?.email || "",
            phoneNumber: editingStudent?.phone_number || "",
            password: ""
        });

        setImagePreview(getProfileImageUrl(editingStudent?.profile_image));
        setProfileImage(null);
        setImageError("");
        setFormError("");
        setFieldErrors({});
        setShowPassword(false);
    }, [show, editingStudent]);

    useEffect(() => {
        if (!imagePreview.startsWith("blob:")) return;

        return () => URL.revokeObjectURL(imagePreview);
    }, [imagePreview]);

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
        setFormError("");

        if (!file) return;

        const validMimeTypes = ["image/png", "image/jpeg"];
        const validExtension = /\.(png|jpe?g)$/i.test(file.name);

        if (!validMimeTypes.includes(file.type) || !validExtension) {
            setImageError("Only PNG, JPG and JPEG images are allowed.");
            event.target.value = "";
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setImageError("Image size must not exceed 2 MB.");
            event.target.value = "";
            return;
        }

        setProfileImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleClose = () => {
        if (formLoading) return;

        setProfileImage(null);
        setImagePreview("");
        setFormError("");
        setFieldErrors({});
        setImageError("");
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        const errors = validateStudent(formData, Boolean(editingStudent));
        setFieldErrors(errors);

        if (Object.keys(errors).length) {
            setFormError("Please correct the highlighted fields.");
            return;
        }

        if (imageError) {
            setFormError("Please choose a valid image.");
            return;
        }

        const body = new FormData();

        body.append("registrationNo", formData.registrationNo.trim());
        body.append("firstName", formData.firstName.trim());
        body.append("lastName", formData.lastName.trim());
        body.append("email", formData.email.trim());
        body.append("phoneNumber", formData.phoneNumber.trim());

        if (!editingStudent) {
            body.append("password", formData.password);
        }

        if (profileImage) {
            body.append("profileImage", profileImage);
        }

        try {
            setFormLoading(true);

            await apiRequest(
                editingStudent
                    ? `/api/students/${editingStudent.student_id}`
                    : "/api/students/",
                {
                    method: editingStudent ? "PUT" : "POST",
                    body
                }
            );

            // Reload list before closing the form.
            await onSuccess();

            setProfileImage(null);
            setImagePreview("");
            onClose();
        } catch (error) {
            console.error("Save student error:", error);

            if (error.status === 401) {
                onAuthError();
                return;
            }

            if (error.status === 403) {
                setFormError("You do not have permission to modify students.");
                return;
            }

            const serverErrors = error.data?.errors;

            if (serverErrors && typeof serverErrors === "object") {
                const mapped = {};

                Object.entries(serverErrors).forEach(([key, value]) => {
                    const frontendKey = {
                        registrationNo: "registrationNo",
                        firstName: "firstName",
                        lastName: "lastName",
                        email: "email",
                        phoneNumber: "phoneNumber",
                        password: "password"
                    }[key];

                    if (frontendKey) {
                        mapped[frontendKey] =
                            typeof value === "string" ? value : "Invalid value.";
                    }
                });

                setFieldErrors(mapped);
            }

            setFormError(error.message || "Failed to save student.");
        } finally {
            setFormLoading(false);
        }
    };

    if (!show) return null;

    const renderError = (field) =>
        fieldErrors[field] ? (
            <small className="field-validation-error" role="alert">
                {fieldErrors[field]}
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
                        <h3>{editingStudent ? "Edit Student" : "Add New Student"}</h3>
                        <p>
                            {editingStudent
                                ? "Update details or replace the profile image."
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

                <form className="student-form" onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="registrationNo">Registration Number</label>
                        <input
                            id="registrationNo"
                            name="registrationNo"
                            value={formData.registrationNo}
                            onChange={handleInputChange}
                            maxLength={20}
                            autoComplete="off"
                            disabled={formLoading}
                            required
                            aria-invalid={Boolean(fieldErrors.registrationNo)}
                        />
                        {renderError("registrationNo")}
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
                            aria-invalid={Boolean(fieldErrors.firstName)}
                        />
                        {renderError("firstName")}
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
                            aria-invalid={Boolean(fieldErrors.lastName)}
                        />
                        {renderError("lastName")}
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
                            aria-invalid={Boolean(fieldErrors.email)}
                        />
                        {renderError("email")}
                    </div>

                    <div className="form-group">
                        <label htmlFor="phoneNumber">Phone Number</label>
                        <input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            inputMode="numeric"
                            value={formData.phoneNumber}
                            onChange={(event) => {
                                const phoneNumber = event.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 10);

                                setFormData((previous) => ({
                                    ...previous,
                                    phoneNumber
                                }));

                                setFieldErrors((previous) => ({
                                    ...previous,
                                    phoneNumber: ""
                                }));
                            }}
                            maxLength={10}
                            disabled={formLoading}
                            required
                            aria-invalid={Boolean(fieldErrors.phoneNumber)}
                        />
                        {renderError("phoneNumber")}
                    </div>

                    <div className="form-group">
                        <label htmlFor="profileImage">Profile Image</label>
                        <input
                            key={editingStudent?.student_id || "new-student"}
                            id="profileImage"
                            type="file"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            onChange={handleImageChange}
                            disabled={formLoading}
                        />

                        <small>
                            PNG, JPG or JPEG; maximum 2 MB.
                            {editingStudent
                                ? " Choose an image to replace the current photo."
                                : " Image is optional."}
                        </small>

                        {imageError && (
                            <p className="image-validation-error" role="alert">
                                {imageError}
                            </p>
                        )}

                        {imagePreview && (
                            <div className="profile-image-preview">
                                <img
                                    src={imagePreview}
                                    alt="Student profile preview"
                                    width="120"
                                    height="120"
                                    style={{
                                        objectFit: "cover",
                                        borderRadius: "50%"
                                    }}
                                />
                                {profileImage && <p>{profileImage.name}</p>}
                            </div>
                        )}
                    </div>

                    {!editingStudent && (
                        <div className="form-group">
                            <label htmlFor="password">Password</label>

                            <div className="password-input-wrapper">
                                <input
                                    id="password"
                                    name="password"
                                    className="password-input"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    autoComplete="new-password"
                                    disabled={formLoading}
                                    required
                                    aria-invalid={Boolean(fieldErrors.password)}
                                />

                                <button
                                    type="button"
                                    className="password-toggle-button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    disabled={formLoading}
                                >
                                    <EyeIcon hidden={!showPassword} />
                                </button>
                            </div>

                            {renderError("password")}
                            <small>
                                At least 8 characters, including uppercase, lowercase,
                                number and special character.
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
