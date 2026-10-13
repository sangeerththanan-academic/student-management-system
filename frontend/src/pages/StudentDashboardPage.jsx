import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, X } from "lucide-react";

import {
    getStoredUser,
    logout
} from "../services/authService";

import apiRequest from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

import "../styles/studentDashboard.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function StudentDashboardPage() {
    const navigate = useNavigate();

    const user = getStoredUser();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showImageDialog, setShowImageDialog] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageError, setImageError] = useState("");
    const [imageSaving, setImageSaving] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await apiRequest(
                    "/api/students/me",
                    { method: "GET" }
                );

                if (data.student) {
                    setStudent(data.student);
                }

            } catch (err) {
                console.error("Failed to load profile:", err);

                if (err.status === 401) {
                    logout();
                    navigate("/login", { replace: true });
                    return;
                }

                setError(
                    err.message || "Failed to load your profile."
                );
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [navigate]);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const closeImageDialog = () => {
        if (imageSaving) return;
        setShowImageDialog(false);
        setSelectedImage(null);
        setImageError("");
    };

    const handleImageSelection = (event) => {
        const file = event.target.files?.[0] || null;
        setImageError("");
        setSelectedImage(null);

        if (!file) return;

        const extension = file.name.split(".").pop().toLowerCase();
        if (
            !["png", "jpg", "jpeg"].includes(extension) ||
            !["image/png", "image/jpeg"].includes(file.type)
        ) {
            setImageError("Choose a PNG, JPG, or JPEG image.");
            event.target.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setImageError("The image must be 10 MB or smaller.");
            event.target.value = "";
            return;
        }

        setSelectedImage(file);
    };

    const handleSaveImage = async (event) => {
        event.preventDefault();
        if (!selectedImage) {
            setImageError("Choose an image to continue.");
            return;
        }

        const requestData = new FormData();
        requestData.append("profileImage", selectedImage);

        try {
            setImageSaving(true);
            const data = await apiRequest("/api/students/me/profile-image", {
                method: "PUT",
                body: requestData
            });

            setStudent((currentStudent) => ({
                ...currentStudent,
                profile_img_url: data.profileImageUrl
            }));
            setShowImageDialog(false);
            setSelectedImage(null);
            setImageError("");
        } catch (requestError) {
            if (requestError.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }

            setImageError(requestError.message || "Failed to update profile image.");
        } finally {
            setImageSaving(false);
        }
    };

    const handleRemoveImage = async () => {
        if (!student?.profile_img_url) return;
        if (!window.confirm("Remove your profile image?")) return;

        try {
            setError("");
            const data = await apiRequest("/api/students/me/profile-image", {
                method: "DELETE"
            });
            setStudent((currentStudent) => ({
                ...currentStudent,
                profile_img_url: data.profileImageUrl ?? null
            }));
        } catch (requestError) {
            if (requestError.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }

            setError(requestError.message || "Failed to remove profile image.");
        }
    };

    const profileImageSource = student?.profile_img_url
        ? new URL(student.profile_img_url, API_BASE_URL).toString()
        : null;

    return (
        <div className="student-dashboard-page">

            {/* Header */}
            <header className="student-dashboard-header">
                <div>
                    <h1>Student Portal</h1>
                    <p>Welcome, {user?.username}</p>
                </div>

                <div className="student-header-actions">
                    <span className="role-badge">STUDENT</span>
                    <ThemeToggle />
                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="student-dashboard-main">

                <h2 className="section-title">My Profile</h2>

                {error && (
                    <div className="student-error">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="student-loading">
                        Loading your profile...
                    </div>
                ) : student ? (
                    <div className="profile-card">

                        <div className="profile-header">
                            <div className="profile-avatar-wrap">
                                <div className="profile-avatar">
                                    {profileImageSource ? (
                                        <img src={profileImageSource} alt="Profile" />
                                    ) : (
                                        <>
                                            {student.first_name?.charAt(0)}
                                            {student.last_name?.charAt(0)}
                                        </>
                                    )}
                                </div>
                                <div className="profile-avatar-actions">
                                    <button
                                        type="button"
                                        aria-label="Edit profile image"
                                        title="Edit profile image"
                                        onClick={() => {
                                            setSelectedImage(null);
                                            setImageError("");
                                            setShowImageDialog(true);
                                        }}
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Remove profile image"
                                        title="Remove profile image"
                                        disabled={!student.profile_img_url}
                                        onClick={handleRemoveImage}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="profile-name">
                                <h3>
                                    {student.first_name} {student.last_name}
                                </h3>
                                <p>{student.registration_no}</p>
                            </div>
                        </div>

                        <div className="profile-details">

                            <div className="detail-row">
                                <span className="detail-label">
                                    Registration No
                                </span>
                                <span className="detail-value">
                                    {student.registration_no}
                                </span>
                            </div>

                            <div className="detail-row">
                                <span className="detail-label">
                                    Full Name
                                </span>
                                <span className="detail-value">
                                    {student.first_name} {student.last_name}
                                </span>
                            </div>

                            <div className="detail-row">
                                <span className="detail-label">
                                    Email
                                </span>
                                <span className="detail-value">
                                    {student.email}
                                </span>
                            </div>

                            <div className="detail-row">
                                <span className="detail-label">
                                    Phone
                                </span>
                                <span className="detail-value">
                                    {student.phone_number}
                                </span>
                            </div>

                            <div className="detail-row">
                                <span className="detail-label">
                                    Member Since
                                </span>
                                <span className="detail-value">
                                    {new Date(
                                        student.created_at
                                    ).toLocaleDateString()}
                                </span>
                            </div>

                        </div>

                    </div>
                ) : (
                    !error && (
                        <div className="student-loading">
                            No profile data found.
                        </div>
                    )
                )}

            </main>

            {showImageDialog && (
                <div
                    className="profile-image-dialog-backdrop"
                    onClick={closeImageDialog}
                >
                    <section
                        className="profile-image-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="profile-image-dialog-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="profile-image-dialog-header">
                            <h3 id="profile-image-dialog-title">Update profile image</h3>
                            <button
                                type="button"
                                className="profile-image-dialog-close"
                                aria-label="Close dialog"
                                onClick={closeImageDialog}
                                disabled={imageSaving}
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveImage}>
                            <label className="profile-image-file-label" htmlFor="student-profile-image">
                                Select an image
                            </label>
                            <input
                                id="student-profile-image"
                                type="file"
                                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                onChange={handleImageSelection}
                                disabled={imageSaving}
                            />
                            <p className="profile-image-file-hint">PNG, JPG, or JPEG, up to 10 MB</p>

                            {selectedImage && (
                                <p className="profile-image-selected-name">{selectedImage.name}</p>
                            )}
                            {imageError && (
                                <p className="profile-image-dialog-error" role="alert">{imageError}</p>
                            )}

                            <div className="profile-image-dialog-actions">
                                <button
                                    type="button"
                                    className="profile-image-cancel"
                                    onClick={closeImageDialog}
                                    disabled={imageSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="profile-image-save"
                                    disabled={imageSaving || !selectedImage}
                                >
                                    {imageSaving ? "Uploading..." : "Save image"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

        </div>
    );
}

export default StudentDashboardPage;