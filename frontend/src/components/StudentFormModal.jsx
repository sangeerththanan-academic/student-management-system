import { useEffect, useRef, useState } from "react";
import apiRequest from "../services/api";

const getProfileImageUrl = (profileImage) => {
    if (!profileImage) return "";

    if (
        profileImage.startsWith("http://") ||
        profileImage.startsWith("https://")
    ) {
        return profileImage;
    }

    const apiBaseUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:5000"
    ).replace(/\/$/, "");

    if (profileImage.startsWith("/")) {
        return `${apiBaseUrl}${profileImage}`;
    }

    return `${apiBaseUrl}/uploads/students/${profileImage}`;
};

function StudentFormModal({
    show,
    editingStudent,
    onClose,
    onSuccess,
    onAuthError
}) {
    const [formData, setFormData] = useState(() => ({
        registrationNo: editingStudent?.registration_no || "",
        firstName: editingStudent?.first_name || "",
        lastName: editingStudent?.last_name || "",
        email: editingStudent?.email || "",
        phoneNumber: editingStudent?.phone_number || "",
        password: ""
    }));

    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(() =>
        editingStudent
            ? getProfileImageUrl(editingStudent.profile_image)
            : ""
    );
    const [imageError, setImageError] = useState("");
    const previewUrlRef = useRef("");

    const updateImagePreview = (preview) => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
        }

        previewUrlRef.current = preview.startsWith("blob:")
            ? preview
            : "";
        setImagePreview(preview);
    };

    useEffect(() => () => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
        }
    }, []);

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

        if (!file) {
            setSelectedImage(null);
            updateImagePreview("");
            return;
        }

        const extension = file.name.split(".").pop()?.toLowerCase();
        const validImageType =
            (extension === "png" && file.type === "image/png") ||
            (["jpg", "jpeg"].includes(extension) &&
                file.type === "image/jpeg");

        if (!validImageType) {
            const message = "Only PNG, JPG and JPEG images are allowed.";
            event.target.value = "";
            setSelectedImage(null);
            updateImagePreview("");
            setImageError(message);
            setFormError(message);
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            const message = "Profile images must be 2 MB or smaller.";
            event.target.value = "";
            setSelectedImage(null);
            updateImagePreview("");
            setImageError(message);
            setFormError(message);
            return;
        }

        setSelectedImage(file);
        updateImagePreview(URL.createObjectURL(file));
    };


    const validateForm = () => {
        const errors = {};

        const registrationNo = formData.registrationNo.trim();
        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim();
        const phoneNumber = formData.phoneNumber.trim();
        const password = formData.password;

        // Registration Number Validation
        if (!registrationNo) {
            errors.registrationNo = "Registration number is required.";
        } else if (registrationNo.length < 2) {
            errors.registrationNo =
                "Registration number must contain at least 2 characters.";
        } else if (!/^[A-Za-z0-9/-]+$/.test(registrationNo)) {
            errors.registrationNo =
                "Registration number contains invalid characters.";
        }

        // First Name Validation
        if (!firstName) {
            errors.firstName = "First name is required.";
        } else if (firstName.length < 3) {
            errors.firstName =
                "First name must contain at least 3 characters.";
        } else if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(firstName)) {
            errors.firstName =
                "First name can contain alphabetic characters only.";
        }

        // Last Name Validation
        if (!lastName) {
            errors.lastName = "Last name is required.";
        } else if (lastName.length < 3) {
            errors.lastName =
                "Last name must contain at least 3 characters.";
        } else if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(lastName)) {
            errors.lastName =
                "Last name can contain alphabetic characters only.";
        }

        // Email Validation
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        if (!email) {
            errors.email = "Email address is required.";
        } else if (!emailRegex.test(email)) {
            errors.email =
                "Please enter a valid email address.";
        }

        // Phone Number Validation
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

        // Password Validation
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

        setFieldErrors(errors);

        return Object.keys(errors).length === 0;
    };

    const handleClose = () => {
        if (formLoading) return;

        setFormError("");
        setFieldErrors({});
        setShowPassword(false);
        setSelectedImage(null);
        updateImagePreview("");
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        const isValid = validateForm();

        if (!isValid) {
            setFormError(
                "Please correct the validation errors before submitting."
            );
            return;
        }

        try {
            setFormLoading(true);

            const studentForm = new FormData();
            studentForm.append(
                "registrationNo",
                formData.registrationNo.trim()
            );
            studentForm.append("firstName", formData.firstName.trim());
            studentForm.append("lastName", formData.lastName.trim());
            studentForm.append("email", formData.email.trim());
            studentForm.append("phoneNumber", formData.phoneNumber.trim());

            if (!editingStudent) {
                studentForm.append("password", formData.password);
            }

            if (selectedImage) {
                studentForm.append("profileImage", selectedImage);
            }

            if (editingStudent) {
                await apiRequest(
                    `/api/students/${editingStudent.student_id}`,
                    {
                        method: "PUT",
                        body: studentForm
                    }
                );
            } else {
                await apiRequest(
                    "/api/students/",
                    {
                        method: "POST",
                        body: studentForm
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

            setFormError(error.message || "Failed to save student.");
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

                        {fieldErrors.registrationNo && (
                            <small className="validation-error">
                                {fieldErrors.registrationNo}
                            </small>
                        )}

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

                        {fieldErrors.firstName && (
                            <small className="validation-error">
                                {fieldErrors.firstName}
                            </small>
                        )}

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

                        {fieldErrors.lastName && (
                            <small className="validation-error">
                                {fieldErrors.lastName}
                            </small>
                        )}

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

                        {fieldErrors.email && (
                            <small className="validation-error">
                                {fieldErrors.email}
                            </small>
                        )}

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
                            inputMode="numeric"
                            maxLength={10}
                        />

                        {fieldErrors.phoneNumber && (
                            <small className="validation-error">
                                {fieldErrors.phoneNumber}
                            </small>
                        )}

                    </div>

                    <div className="form-group profile-image-field">
                        <label htmlFor="profile-image">
                            Profile Image
                        </label>

                        <input
                            id="profile-image"
                            type="file"
                            name="profileImage"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            onChange={handleImageChange}
                            disabled={formLoading}
                        />

                        <small>
                            Supported formats: PNG, JPG, JPEG. Maximum size: 2 MB.
                        </small>

                        {editingStudent && !selectedImage && imagePreview && (
                            <small>
                                Choose a new image to replace the current profile image.
                            </small>
                        )}

                        {imageError && (
                            <small
                                className="validation-error"
                                role="alert"
                            >
                                {imageError}
                            </small>
                        )}

                        {imagePreview && (
                            <img
                                className="profile-image-preview"
                                src={imagePreview}
                                alt="Student profile preview"
                            />
                        )}
                    </div>


                    {/* Password */}

                    {!editingStudent && (
                        <div className="form-group">

                            <label htmlFor="student-password">
                                Password
                            </label>

                            <div className="password-input-wrapper">

                                <input
                                    id="student-password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    disabled={formLoading}
                                    required
                                    autoComplete="new-password"
                                    aria-describedby="student-password-hint"
                                    aria-invalid={
                                        !!fieldErrors.password
                                    }
                                />

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
                                    {showPassword ? "🙈" : "👁️"}
                                </button>

                            </div>

                            {fieldErrors.password && (
                                <small
                                    id="student-password-hint"
                                    className="validation-error"
                                >
                                    {fieldErrors.password}
                                </small>
                            )}

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