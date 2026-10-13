import { useEffect, useState } from "react";
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
    const [profileImage, setProfileImage] = useState(null);
    const [imageError, setImageError] = useState("");
    const [imagePreview, setImagePreview] = useState("");

    // Load student details and current image when the modal opens.
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

            setImagePreview(
                getProfileImageUrl(editingStudent.profile_image)
            );
        } else {
            setFormData({
                registrationNo: "",
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                password: ""
            });

            setImagePreview("");
        }

        setFormError("");
        setImageError("");
        setProfileImage(null);
    }, [editingStudent, show]);

    // Release temporary preview URLs when the preview changes.
    useEffect(() => {
        if (!imagePreview || !imagePreview.startsWith("blob:")) {
            return;
        }

        return () => {
            URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        setProfileImage(null);
        setImageError("");

        if (!file) return;

        const allowedTypes = ["image/png", "image/jpeg"];
        const allowedExtensions = /\.(png|jpe?g)$/i;

        if (
            !allowedTypes.includes(file.type) ||
            !allowedExtensions.test(file.name)
        ) {
            setImageError(
                "Only PNG, JPG and JPEG images are allowed."
            );
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

        setFormError("");
        setImageError("");
        setProfileImage(null);
        setImagePreview("");
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

        if (!editingStudent && !formData.password) {
            setFormError("Password is required for a new student.");
            return;
        }

        if (imageError) {
            setFormError("Please select a valid profile image.");
            return;
        }

        try {
            setFormLoading(true);

            // Use FormData for both creating and editing students.
            const studentData = new FormData();

            studentData.append(
                "registrationNo",
                formData.registrationNo.trim()
            );
            studentData.append(
                "firstName",
                formData.firstName.trim()
            );
            studentData.append(
                "lastName",
                formData.lastName.trim()
            );
            studentData.append(
                "email",
                formData.email.trim()
            );
            studentData.append(
                "phoneNumber",
                formData.phoneNumber.trim()
            );

            // Password is required only when adding a new student.
            if (!editingStudent) {
                studentData.append("password", formData.password);
            }

            // Attach an image only if the user selected a new file.
            if (profileImage) {
                studentData.append("profileImage", profileImage);
            }

            await apiRequest(
                editingStudent
                    ? `/api/students/${editingStudent.student_id}`
                    : "/api/students/",
                {
                    method: editingStudent ? "PUT" : "POST",
                    body: studentData
                }
            );

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
                        <h3>
                            {editingStudent
                                ? "Edit Student"
                                : "Add New Student"}
                        </h3>

                        <p>
                            {editingStudent
                                ? "Update student information and profile image."
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
                    <div className="dashboard-error" role="alert">
                        {formError}
                    </div>
                )}

                <form
                    className="student-form"
                    onSubmit={handleSubmit}
                >
                    <div className="form-group">
                        <label htmlFor="registrationNo">
                            Registration Number
                        </label>

                        <input
                            id="registrationNo"
                            name="registrationNo"
                            type="text"
                            value={formData.registrationNo}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="firstName">First Name</label>

                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="lastName">Last Name</label>

                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                        />
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
                    </div>

                    <div className="form-group">
                        <label htmlFor="phoneNumber">
                            Phone Number
                        </label>

                        <input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="text"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                        />
                    </div>

                    {/* Profile image upload for Add and Edit */}
                    <div className="form-group">
                        <label htmlFor="profileImage">
                            Profile Image
                        </label>

                        <input
                            id="profileImage"
                            type="file"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            onChange={handleImageChange}
                            disabled={formLoading}
                        />

                        <small>
                            PNG, JPG or JPEG. Maximum size: 2 MB.
                            {editingStudent
                                ? " Choose a new image to replace the current one."
                                : " Image is optional."}
                        </small>

                        {imageError && (
                            <p
                                className="image-validation-error"
                                role="alert"
                            >
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
                                    onError={(event) => {
                                        event.currentTarget.style.display =
                                            "none";
                                    }}
                                />

                                {profileImage && (
                                    <p>{profileImage.name}</p>
                                )}
                            </div>
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
                                    : "Create Student"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default StudentFormModal;
