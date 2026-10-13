import { useEffect, useState } from "react";

import apiRequest, { resolveProfileImageUrl } from "../services/api";

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

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
    const [photoError, setPhotoError] = useState("");
    const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);

    const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
    const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
            setExistingPhotoUrl(resolveProfileImageUrl(editingStudent.profile_image));
        } else {
            setFormData({
                registrationNo: "",
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                password: ""
            });
            setExistingPhotoUrl(null);
        }

        setFormError("");
        setPhotoFile(null);
        setPhotoError("");
        setPhotoPreviewUrl(null);
    }, [editingStudent, show]);


    // Revoke object URL to avoid memory leaks
    useEffect(() => {
        return () => {
            if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(photoPreviewUrl);
            }
        };
    }, [photoPreviewUrl]);


    const handlePhotoChange = (event) => {
        const file = event.target.files && event.target.files[0];

        setPhotoError("");

        if (!file) {
            setPhotoFile(null);
            setPhotoPreviewUrl(null);
            return;
        }

        if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
            setPhotoError("Only JPEG, PNG and WebP images are allowed.");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_PHOTO_SIZE) {
            setPhotoError("Profile photo must be 2MB or smaller.");
            event.target.value = "";
            return;
        }

        if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(photoPreviewUrl);
        }

        setPhotoFile(file);
        setPhotoPreviewUrl(URL.createObjectURL(file));
    };


    const handleRemovePhoto = () => {
        if (photoPreviewUrl && photoPreviewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(photoPreviewUrl);
        }
        setPhotoFile(null);
        setPhotoPreviewUrl(null);
        setPhotoError("");
    };


    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };


    const handleClose = () => {
        setFormError("");
        handleRemovePhoto();
        onClose();
    };


    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");

        if (
            !formData.registrationNo.trim() ||
            !formData.firstName.trim() ||
            !formData.lastName.trim() ||
            !formData.email.trim() ||
            !formData.phoneNumber.trim()
        ) {
            setFormError("All student fields are required.");
            return;
        }

        // Password is required only when creating
        if (!editingStudent && !formData.password) {
            setFormError("Password is required for a new student.");
            return;
        }

        if (photoError) {
            setFormError(photoError);
            return;
        }

        try {
            setFormLoading(true);

            if (editingStudent) {
                const submitData = new FormData();
                submitData.append("registrationNo", formData.registrationNo.trim());
                submitData.append("firstName", formData.firstName.trim());
                submitData.append("lastName", formData.lastName.trim());
                submitData.append("email", formData.email.trim());
                submitData.append("phoneNumber", formData.phoneNumber.trim());

                if (photoFile) {
                    submitData.append("profilePhoto", photoFile);
                }

                await apiRequest(
                    `/api/students/${editingStudent.student_id}`,
                    {
                        method: "PUT",
                        body: submitData
                    }
                );
            } else {
                const submitData = new FormData();
                submitData.append("registrationNo", formData.registrationNo.trim());
                submitData.append("firstName", formData.firstName.trim());
                submitData.append("lastName", formData.lastName.trim());
                submitData.append("email", formData.email.trim());
                submitData.append("phoneNumber", formData.phoneNumber.trim());
                submitData.append("password", formData.password);

                if (photoFile) {
                    submitData.append("profilePhoto", photoFile);
                }

                await apiRequest(
                    "/api/students/",
                    {
                        method: "POST",
                        body: submitData
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


                <div className="form-group photo-group">
                    <label>
                        Profile Photo (optional)
                    </label>

                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoChange}
                        disabled={formLoading}
                    />

                    <span className="photo-hint">
                        JPEG, PNG or WebP up to 2MB.
                        {editingStudent
                            ? " Leave empty to keep the current photo."
                            : ""
                        }
                    </span>

                    {photoError && (
                        <span className="photo-error">
                            {photoError}
                        </span>
                    )}

                    {(photoPreviewUrl || (editingStudent && existingPhotoUrl)) && (
                        <div className="photo-preview">
                            <img
                                src={photoPreviewUrl || existingPhotoUrl}
                                alt={photoPreviewUrl ? "Selected profile preview" : "Current profile photo"}
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                            {photoPreviewUrl ? (
                                <button
                                    type="button"
                                    className="photo-remove"
                                    onClick={handleRemovePhoto}
                                    disabled={formLoading}
                                >
                                    Remove
                                </button>
                            ) : (
                                <span className="photo-hint">
                                    Current photo
                                </span>
                            )}
                        </div>
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