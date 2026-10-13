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

    const [showPassword, setShowPassword] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});

    // CR-010: Profile image upload states
    const [profileImage, setProfileImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [imageError, setImageError] = useState(null);

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
            setPreviewUrl(editingStudent.profile_photo || null);
        } else {
            setFormData({
                registrationNo: "",
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                password: ""
            });
            setPreviewUrl(null);
        }

        setProfileImage(null);
        setImageError(null);
        setShowPassword(false);
        setFormError("");
        setFieldErrors({});
        setTouched({});
    }, [editingStudent, show]);



    // ── Validation helpers (CR-004) ─────────────────────────────
    const validateField = (name, value) => {
        const v = (value || "").trim();

        switch (name) {
            case "registrationNo":
                if (!v) return "Registration number is required.";
                if (!/^[A-Za-z0-9_-]+$/.test(v))
                    return "Only letters, numbers, hyphens, or underscores allowed.";
                return null;

            case "firstName":
                if (!v) return "First name is required.";
                if (v.length < 3) return "First name must be at least 3 characters.";
                if (!/^[A-Za-z\s]+$/.test(v)) return "First name must contain letters only.";
                return null;

            case "lastName":
                if (!v) return "Last name is required.";
                if (v.length < 3) return "Last name must be at least 3 characters.";
                if (!/^[A-Za-z\s]+$/.test(v)) return "Last name must contain letters only.";
                return null;

            case "email":
                if (!v) return "Email address is required.";
                if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v))
                    return "Enter a valid email address (e.g. user@example.com).";
                return null;

            case "phoneNumber":
                if (!v) return "Phone number is required.";
                if (!/^\d+$/.test(v)) return "Phone number must contain digits only.";
                if (v.length !== 10) return "Phone number must be exactly 10 digits.";
                return null;

            case "password":
                if (editingStudent && !value) return null;
                if (!value) return "Password is required.";
                if (value.length < 8) return "Password must be at least 8 characters.";
                if (!/[A-Z]/.test(value)) return "Password must include an uppercase letter.";
                if (!/[a-z]/.test(value)) return "Password must include a lowercase letter.";
                if (!/[0-9]/.test(value)) return "Password must include a number.";
                if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(value))
                    return "Password must include a special character.";
                return null;

            default:
                return null;
        }
    };

    const validateAll = () => {
        const fields = ["registrationNo", "firstName", "lastName", "email", "phoneNumber"];
        if (!editingStudent || (formData.password && formData.password.trim() !== "")) {
            fields.push("password");
        }

        const errors = {};
        fields.forEach((name) => {
            const err = validateField(name, formData[name]);
            if (err) errors[name] = err;
        });
        return errors;
    };
    // ────────────────────────────────────────────────────────────


    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        // Live-clear the error for the field being edited
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleBlur = (event) => {
        const { name, value } = event.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        const err = validateField(name, value);
        setFieldErrors((prev) => ({ ...prev, [name]: err }));
    };

    // CR-010: Profile image file selection and validation
    const handleFileChange = (event) => {
        setImageError(null);
        const file = event.target.files?.[0];

        if (!file) {
            setProfileImage(null);
            if (previewUrl && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(editingStudent?.profile_photo || null);
            return;
        }

        // Validate file extension and MIME type (PNG, JPG, JPEG)
        const allowedExtensions = ["png", "jpg", "jpeg"];
        const allowedMimeTypes = ["image/png", "image/jpeg", "image/pjpeg"];
        const fileExt = file.name.split(".").pop().toLowerCase();
        const isExtValid = allowedExtensions.includes(fileExt);
        const isMimeValid = !file.type || allowedMimeTypes.includes(file.type.toLowerCase());

        if (!isExtValid || !isMimeValid) {
            setImageError("Only PNG, JPG and JPEG images are allowed.");
            setProfileImage(null);
            if (previewUrl && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(null);
            event.target.value = "";
            return;
        }

        // Validate file size limit (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setImageError("File size must not exceed 5MB.");
            setProfileImage(null);
            if (previewUrl && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(null);
            event.target.value = "";
            return;
        }

        if (previewUrl && previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }

        setProfileImage(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        if (previewUrl && previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }
        setProfileImage(null);
        setPreviewUrl(null);
        setImageError(null);
        const fileInput = document.getElementById("sf-profilePhoto");
        if (fileInput) {
            fileInput.value = "";
        }
    };

    const handleClose = () => {
        if (previewUrl && previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }
        setProfileImage(null);
        setPreviewUrl(null);
        setImageError(null);
        setShowPassword(false);
        setFormError("");
        setFieldErrors({});
        setTouched({});
        onClose();
    };


    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");

        // Check if there is an unresolved image error
        if (imageError) {
            setFormError(imageError);
            return;
        }

        // Mark all fields touched & run full validation
        const errors = validateAll();
        const allFields = ["registrationNo", "firstName", "lastName", "email", "phoneNumber"];
        if (!editingStudent || (formData.password && formData.password.trim() !== "")) {
            allFields.push("password");
        }
        const allTouched = {};
        allFields.forEach((f) => { allTouched[f] = true; });
        setTouched(allTouched);
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            setFormError("Please fix the highlighted errors before submitting.");
            return;
        }

        try {
            setFormLoading(true);

            if (editingStudent) {
                const updatePayload = {
                    registrationNo: formData.registrationNo.trim(),
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    email: formData.email.trim(),
                    phoneNumber: formData.phoneNumber.trim()
                };
                if (formData.password && formData.password.trim() !== "") {
                    updatePayload.password = formData.password;
                }

                await apiRequest(
                    `/api/students/${editingStudent.student_id}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(updatePayload)
                    }
                );
            } else {
                // CR-010: Use FormData to send student details and profile photo
                const formDataPayload = new FormData();
                formDataPayload.append("registrationNo", formData.registrationNo.trim());
                formDataPayload.append("firstName", formData.firstName.trim());
                formDataPayload.append("lastName", formData.lastName.trim());
                formDataPayload.append("email", formData.email.trim());
                formDataPayload.append("phoneNumber", formData.phoneNumber.trim());
                formDataPayload.append("password", formData.password);

                if (profileImage) {
                    formDataPayload.append("profilePhoto", profileImage);
                }

                await apiRequest(
                    "/api/students/",
                    {
                        method: "POST",
                        body: formDataPayload
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

    // Helper: render one form field with inline error
    const renderField = (label, name, type = "text", hint = "") => {
        const isPassword = type === "password" || name === "password";
        const effectiveType = isPassword ? (showPassword ? "text" : "password") : type;

        return (
            <div
                key={name}
                className={`form-group${touched[name] && fieldErrors[name] ? " field-error" : ""}`}
            >
                <label htmlFor={`sf-${name}`}>
                    {label}
                </label>

                {isPassword ? (
                    <div className="password-input-wrapper">
                        <input
                            id={`sf-${name}`}
                            type={effectiveType}
                            name={name}
                            value={formData[name]}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            disabled={formLoading}
                            autoComplete={editingStudent ? "new-password" : "new-password"}
                            aria-describedby={`sf-${name}-hint`}
                            aria-invalid={!!(touched[name] && fieldErrors[name])}
                        />

                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-pressed={showPassword}
                            disabled={formLoading}
                        >
                            {showPassword ? (
                                <EyeOff size={18} className="eye-icon" aria-hidden="true" />
                            ) : (
                                <Eye size={18} className="eye-icon" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                ) : (
                    <input
                        id={`sf-${name}`}
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        disabled={formLoading}
                        autoComplete="off"
                        aria-describedby={`sf-${name}-hint`}
                        aria-invalid={!!(touched[name] && fieldErrors[name])}
                    />
                )}

                {touched[name] && fieldErrors[name] ? (
                    <span id={`sf-${name}-hint`} className="field-error-msg">
                        {fieldErrors[name]}
                    </span>
                ) : hint ? (
                    <span id={`sf-${name}-hint`} className="field-hint">
                        {hint}
                    </span>
                ) : null}
            </div>
        );
    };


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
                <div className="dashboard-error" role="alert">
                    {formError}
                </div>
            )}


            <form
                className="student-form"
                onSubmit={handleSubmit}
                noValidate
            >

                {renderField(
                    "Registration Number",
                    "registrationNo",
                    "text",
                    "Letters, numbers, hyphens, or underscores only."
                )}

                {renderField(
                    "First Name",
                    "firstName",
                    "text",
                    "Min 3 characters, letters only."
                )}

                {renderField(
                    "Last Name",
                    "lastName",
                    "text",
                    "Min 3 characters, letters only."
                )}

                {renderField(
                    "Email",
                    "email",
                    "email",
                    "e.g. student@example.com"
                )}

                {renderField(
                    "Phone Number",
                    "phoneNumber",
                    "text",
                    "Exactly 10 digits, numbers only."
                )}

                {editingStudent ? renderField(
                    "Password (optional)",
                    "password",
                    "password",
                    "Leave blank to keep existing password, or enter new password."
                ) : renderField(
                    "Password",
                    "password",
                    "password",
                    "Min 8 chars with uppercase, lowercase, number & special character."
                )}

                {/* CR-010: Profile Image field in Add Student form */}
                {!editingStudent && (
                    <div className={`form-group${imageError ? " field-error" : ""}`}>
                        <label htmlFor="sf-profilePhoto">
                            Profile Image
                        </label>

                        <div className="profile-image-upload-wrapper">
                            <input
                                id="sf-profilePhoto"
                                type="file"
                                name="profilePhoto"
                                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                onChange={handleFileChange}
                                disabled={formLoading}
                                aria-describedby="sf-profilePhoto-hint"
                                aria-invalid={!!imageError}
                            />

                            {previewUrl && (
                                <div className="profile-image-preview-item">
                                    <img
                                        src={previewUrl}
                                        alt="Selected Profile Preview"
                                        className="profile-preview-thumb"
                                    />
                                    <button
                                        type="button"
                                        className="remove-preview-btn"
                                        onClick={handleRemoveImage}
                                        disabled={formLoading}
                                        title="Remove selected image"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        {imageError ? (
                            <span id="sf-profilePhoto-hint" className="field-error-msg">
                                {imageError}
                            </span>
                        ) : (
                            <span id="sf-profilePhoto-hint" className="field-hint">
                                Supported formats: PNG, JPG, JPEG
                            </span>
                        )}
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