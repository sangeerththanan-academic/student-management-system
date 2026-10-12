
import { useEffect, useState } from "react";
import apiRequest from "../services/api";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg"];

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

            setImagePreview(
                editingStudent.profile_photo
                    ? `http://localhost:5000${editingStudent.profile_photo}`
                    : ""
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

        setProfileImage(null);
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

        setProfileImage(null);
        setFormError("");
        setFieldErrors((previous) => ({
            ...previous,
            profileImage: ""
        }));

        if (!file) {
            setImagePreview(
                editingStudent?.profile_photo
                    ? `http://localhost:5000${editingStudent.profile_photo}`
                    : ""
            );
            return;
        }

        const extension = file.name
            .substring(file.name.lastIndexOf("."))
            .toLowerCase();

        if (
            ![".png", ".jpg", ".jpeg"].includes(extension) ||
            !ALLOWED_TYPES.includes(file.type)
        ) {
            setFieldErrors((previous) => ({
                ...previous,
                profileImage: "Only PNG, JPG, and JPEG images are allowed."
            }));
            event.target.value = "";
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setFieldErrors((previous) => ({
                ...previous,
                profileImage: "Image size must not exceed 2 MB."
            }));
            event.target.value = "";
            return;
        }

        setProfileImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const validateForm = () => {
        const errors = {};

        const registrationNo = formData.registrationNo.trim();
        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim();
        const phoneNumber = formData.phoneNumber.trim();
        const password = formData.password;

        if (!registrationNo) {
            errors.registrationNo = "Registration number is required.";
        } else if (!/^[A-Za-z0-9/-]+$/.test(registrationNo)) {
            errors.registrationNo =
                "Registration number can contain only letters, numbers, hyphens, and slashes.";
        }

        if (!firstName) {
            errors.firstName = "First name is required.";
        } else if (firstName.length < 3) {
            errors.firstName =
                "First name must contain at least 3 characters.";
        } else if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(firstName)) {
            errors.firstName =
                "First name can contain only alphabetic characters.";
        }

        if (!lastName) {
            errors.lastName = "Last name is required.";
        } else if (lastName.length < 3) {
            errors.lastName =
                "Last name must contain at least 3 characters.";
        } else if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(lastName)) {
            errors.lastName =
                "Last name can contain only alphabetic characters.";
        }

        if (!email) {
            errors.email = "Email address is required.";
        } else if (
            !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)
        ) {
            errors.email = "Please enter a valid email address.";
        }

        if (!phoneNumber) {
            errors.phoneNumber = "Phone number is required.";
        } else if (!/^\d+$/.test(phoneNumber)) {
            errors.phoneNumber =
                "Phone number must contain numeric characters only.";
        } else if (phoneNumber.length !== 10) {
            errors.phoneNumber =
                "Phone number must contain exactly 10 digits.";
        }

        if (!editingStudent) {
            if (!password) {
                errors.password = "Password is required for a new student.";
            } else if (password.length < 8) {
                errors.password = "Password must contain at least 8 characters.";
            } else if (!/[A-Z]/.test(password)) {
                errors.password = "Password must contain an uppercase letter.";
            } else if (!/[a-z]/.test(password)) {
                errors.password = "Password must contain a lowercase letter.";
            } else if (!/[0-9]/.test(password)) {
                errors.password = "Password must contain a number.";
            } else if (!/[^A-Za-z0-9]/.test(password)) {
                errors.password = "Password must contain a special character.";
            }
        }

        setFieldErrors((previous) => ({
            ...previous,
            ...errors
        }));

        return Object.keys(errors).length === 0;
    };

    const handleClose = () => {
        if (imagePreview && profileImage) {
            URL.revokeObjectURL(imagePreview);
        }

        setProfileImage(null);
        setImagePreview("");
        setFormError("");
        setFieldErrors({});
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        if (!validateForm()) return;

        try {
            setFormLoading(true);

            if (editingStudent) {
                // Existing Edit Student behavior is preserved.
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
                const data = new FormData();

                data.append("registrationNo", formData.registrationNo.trim());
                data.append("firstName", formData.firstName.trim());
                data.append("lastName", formData.lastName.trim());
                data.append("email", formData.email.trim());
                data.append("phoneNumber", formData.phoneNumber.trim());
                data.append("password", formData.password);

                if (profileImage) {
                    data.append("profileImage", profileImage);
                }

                await apiRequest("/api/students/", {
                    method: "POST",
                    body: data
                });
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

            if (error.data?.errors) {
                setFieldErrors((previous) => ({
                    ...previous,
                    ...error.data.errors
                }));
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
                            {editingStudent ? "Edit Student" : "Add New Student"}
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
                    >
                        ×
                    </button>
                </div>

                {formError && (
                    <div className="dashboard-error">{formError}</div>
                )}

                <form
                    className="student-form"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <div className="form-group">
                        <label>Profile Image (Optional)</label>

                        {imagePreview && (
                            <img
                                src={imagePreview}
                                alt="Profile preview"
                                style={{
                                    width: "100px",
                                    height: "100px",
                                    objectFit: "cover",
                                    borderRadius: "50%",
                                    display: "block",
                                    marginBottom: "10px"
                                }}
                            />
                        )}

                        <input
                            type="file"
                            name="profileImage"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            onChange={handleImageChange}
                            disabled={formLoading}
                        />

                        <small className="form-help">
                            PNG, JPG, or JPEG only. Maximum file size: 2 MB.
                        </small>

                        {fieldErrors.profileImage && (
                            <small className="form-error">
                                {fieldErrors.profileImage}
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Registration Number</label>
                        <input
                            type="text"
                            name="registrationNo"
                            value={formData.registrationNo}
                            onChange={handleInputChange}
                            disabled={formLoading}
                        />
                        {fieldErrors.registrationNo && (
                            <small className="form-error">
                                {fieldErrors.registrationNo}
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            disabled={formLoading}
                        />
                        {fieldErrors.firstName && (
                            <small className="form-error">
                                {fieldErrors.firstName}
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            disabled={formLoading}
                        />
                        {fieldErrors.lastName && (
                            <small className="form-error">
                                {fieldErrors.lastName}
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={formLoading}
                        />
                        {fieldErrors.email && (
                            <small className="form-error">
                                {fieldErrors.email}
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            inputMode="numeric"
                            maxLength={10}
                        />
                        {fieldErrors.phoneNumber && (
                            <small className="form-error">
                                {fieldErrors.phoneNumber}
                            </small>
                        )}
                    </div>

                    {!editingStudent && (
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                disabled={formLoading}
                            />

                            {fieldErrors.password && (
                                <small className="form-error">
                                    {fieldErrors.password}
                                </small>
                            )}

                            <small className="form-help">
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
