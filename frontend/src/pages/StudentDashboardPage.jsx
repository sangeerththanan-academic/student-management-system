import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getStoredUser,
    logout
} from "../services/authService";

import apiRequest from "../services/api";

import "../styles/studentDashboard.css";

function StudentDashboardPage() {
    const navigate = useNavigate();

    const user = getStoredUser();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        phoneNumber: ""
    });
    const [validationError, setValidationError] = useState("");

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

    const handleEditProfile = () => {
        setFormData({
            email: student.email || "",
            phoneNumber: student.phone_number || ""
        });
        setValidationError("");
        setError("");
        setSuccess("");
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setValidationError("");
    };

    const handleProfileSubmit = async (event) => {
        event.preventDefault();

        const email = formData.email.trim();
        const phoneNumber = formData.phoneNumber.trim();

        if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
            setValidationError("Please enter a valid email address.");
            return;
        }

        if (!/^\d{10}$/.test(phoneNumber)) {
            setValidationError("Phone number must contain exactly 10 digits.");
            return;
        }

        try {
            setIsSaving(true);
            setError("");
            setValidationError("");
            setSuccess("");

            const result = await apiRequest(
                "/api/students/me",
                {
                    method: "PUT",
                    body: JSON.stringify({ email, phoneNumber })
                }
            );

            if (result.student) {
                setStudent(result.student);
            }

            setIsEditing(false);
            setSuccess(result.message || "Profile updated successfully.");

            try {
                const refreshedProfile = await apiRequest(
                    "/api/students/me",
                    { method: "GET" }
                );

                if (refreshedProfile.student) {
                    setStudent(refreshedProfile.student);
                }
            } catch (refreshError) {
                console.error("Failed to refresh updated profile:", refreshError);
                setError("Your profile was saved, but the latest details could not be refreshed.");
            }
        } catch (err) {
            console.error("Failed to update profile:", err);

            if (err.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }

            setError(err.message || "Failed to update your profile.");
        } finally {
            setIsSaving(false);
        }
    };

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

                {success && (
                    <div className="student-success" role="status">
                        {success}
                    </div>
                )}

                {loading ? (
                    <div className="student-loading">
                        Loading your profile...
                    </div>
                ) : student ? (
                    <div className="profile-card">

                        <div className="profile-header">
                            <div className="profile-avatar">
                                {student.first_name?.charAt(0)}
                                {student.last_name?.charAt(0)}
                            </div>
                            <div className="profile-name">
                                <h3>
                                    {student.first_name} {student.last_name}
                                </h3>
                                <p>{student.registration_no}</p>
                            </div>
                            {!isEditing && (
                                <button
                                    className="edit-profile-button"
                                    type="button"
                                    onClick={handleEditProfile}
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form
                                className="profile-edit-form"
                                onSubmit={handleProfileSubmit}
                                noValidate
                            >
                                <label className="profile-form-field">
                                    <span>Email address</span>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(event) => setFormData({
                                            ...formData,
                                            email: event.target.value
                                        })}
                                        autoComplete="email"
                                        required
                                    />
                                </label>

                                <label className="profile-form-field">
                                    <span>Phone number</span>
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(event) => setFormData({
                                            ...formData,
                                            phoneNumber: event.target.value
                                        })}
                                        autoComplete="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        required
                                    />
                                </label>

                                {validationError && (
                                    <p className="profile-validation-error" role="alert">
                                        {validationError}
                                    </p>
                                )}

                                <div className="profile-form-actions">
                                    <button
                                        className="save-profile-button"
                                        type="submit"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button
                                        className="cancel-profile-button"
                                        type="button"
                                        onClick={handleCancelEdit}
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
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
                        )}

                    </div>
                ) : (
                    !error && (
                        <div className="student-loading">
                            No profile data found.
                        </div>
                    )
                )}

            </main>

        </div>
    );
}

export default StudentDashboardPage;