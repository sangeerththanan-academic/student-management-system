import { useEffect, useState } from "react";
import PasswordShowHide from "./PasswordShowHide"

import apiRequest from "../services/api";
import "../styles/login.css";

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

        setProfileImage(null);
        setFormError("");
    }, [editingStudent, show]);


    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };


    const handleProfileImageChange = (event) => {
        const selectedFile = event.target.files?.[0] || null;
        setProfileImage(selectedFile);
        setFormError("");

        if (!selectedFile) return;

        const extension = selectedFile.name.split(".").pop().toLowerCase();
        const allowedTypes = ["png", "jpg", "jpeg"];

        if (!allowedTypes.includes(extension) || !["image/png", "image/jpeg"].includes(selectedFile.type)) {
            setFormError("Profile image must be a PNG, JPG, or JPEG file.");
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            setFormError("Profile image must be 10 MB or smaller.");
        }
    };


    const handleClose = () => {
        setFormError("");
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

        if (profileImage) {
            const extension = profileImage.name.split(".").pop().toLowerCase();
            if (
                !["png", "jpg", "jpeg"].includes(extension) ||
                !["image/png", "image/jpeg"].includes(profileImage.type)
            ) {
                setFormError("Profile image must be a PNG, JPG, or JPEG file.");
                return;
            }

            if (profileImage.size > 10 * 1024 * 1024) {
                setFormError("Profile image must be 10 MB or smaller.");
                return;
            }
        }

        const requestData = new FormData();
        requestData.append("registrationNo", formData.registrationNo.trim());
        requestData.append("firstName", formData.firstName.trim());
        requestData.append("lastName", formData.lastName.trim());
        requestData.append("email", formData.email.trim());
        requestData.append("phoneNumber", formData.phoneNumber.trim());

        if (!editingStudent) {
            requestData.append("password", formData.password);
        }

        if (profileImage) {
            requestData.append("profileImage", profileImage);
        }

        try {
            setFormLoading(true);

            if (editingStudent) {
                await apiRequest(
                    `/api/students/${editingStudent.student_id}`,
                    {
                        method: "PUT",
                        body: requestData
                    }
                );
            } else {
                await apiRequest(
                    "/api/students/",
                    {
                        method: "POST",
                        body: requestData
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

                    <div className="form-group">
                        <label>
                            Profile Img
                        </label>

                        <input
                            type="file"
                            name="profileImage"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            onChange={handleProfileImageChange}
                            disabled={formLoading}
                        />
                        <small>PNG, JPG, or JPEG; 10 MB maximum</small>
                    </div>


                    {!editingStudent && (
                        <div className="form-group">
                            <label>
                                Password
                            </label>

                            <PasswordShowHide password={formData.password} setPassword={(val) => handleInputChange({ target: { name: "password", value: val } })} loadingVal={formLoading} />

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