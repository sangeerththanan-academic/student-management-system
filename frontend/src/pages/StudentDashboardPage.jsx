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
    const [showEditForm, setShowEditForm] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        phoneNumber: ""
    });
    const [formErrors, setFormErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [saving, setSaving] = useState(false);

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
            email: student.email,
            phoneNumber: student.phone_number
        });
        setFormErrors({});
        setFormError("");
        setSuccessMessage("");
        setShowEditForm(true);
    };

    const handleCancelEdit = () => {
        setShowEditForm(false);
        setFormErrors({});
        setFormError("");
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
        setFormErrors((previous) => ({
            ...previous,
            [name]: ""
        }));
        setFormError("");
        setSuccessMessage("");
    };

    const handleProfileUpdate = async (event) => {
        event.preventDefault();

        const email = formData.email.trim();
        const phoneNumber = formData.phoneNumber.trim();
        const validationErrors = {};

        if (!email) {
            validationErrors.email = "Email address is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            validationErrors.email = "Please enter a valid email address.";
        }

        if (!phoneNumber) {
            validationErrors.phoneNumber = "Phone number is required.";
        } else if (!/^\d{10}$/.test(phoneNumber)) {
            validationErrors.phoneNumber = "Phone number must contain exactly 10 digits.";
        }

        setFormErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            setFormError("Please correct the validation errors before saving.");
            return;
        }

        try {
            setSaving(true);
            setFormError("");
            setSuccessMessage("");

            const data = await apiRequest(
                "/api/students/me",
                {
                    method: "PUT",
                    body: JSON.stringify({ email, phoneNumber })
                }
            );

            setStudent(data.student);
            setShowEditForm(false);
            setSuccessMessage(data.message || "Profile updated successfully.");

        } catch (err) {
            console.error("Failed to update profile:", err);

            if (err.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }

            setFormError(err.message || "Failed to update your profile.");

        } finally {
            setSaving(false);
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

                {successMessage && (
                    <div className="student-success" role="status">
                        {successMessage}
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
                        </div>

                        {!showEditForm && (
                            <div className="profile-actions">
                                <button
                                    type="button"
                                    className="profile-edit-button"
                                    onClick={handleEditProfile}
                                >
                                    Edit Profile
                                </button>
                            </div>
                        )}

                        {formError && (
                            <div className="student-error profile-form-message" role="alert">
                                {formError}
                            </div>
                        )}

                        {showEditForm && (
                            <form
                                className="profile-edit-form"
                                onSubmit={handleProfileUpdate}
                                noValidate
                            >
                                <div className="profile-edit-field">
                                    <label htmlFor="profile-email">Email</label>
                                    <input
                                        id="profile-email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={saving}
                                        required
                                        aria-invalid={!!formErrors.email}
                                        aria-describedby={formErrors.email ? "profile-email-error" : undefined}
                                    />
                                    {formErrors.email && (
                                        <small id="profile-email-error" className="profile-field-error">
                                            {formErrors.email}
                                        </small>
                                    )}
                                </div>

                                <div className="profile-edit-field">
                                    <label htmlFor="profile-phone">Phone Number</label>
                                    <input
                                        id="profile-phone"
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        disabled={saving}
                                        required
                                        inputMode="numeric"
                                        maxLength={10}
                                        aria-invalid={!!formErrors.phoneNumber}
                                        aria-describedby={formErrors.phoneNumber ? "profile-phone-error" : undefined}
                                    />
                                    {formErrors.phoneNumber && (
                                        <small id="profile-phone-error" className="profile-field-error">
                                            {formErrors.phoneNumber}
                                        </small>
                                    )}
                                </div>

                                <div className="profile-form-actions">
                                    <button
                                        type="button"
                                        className="profile-cancel-button"
                                        onClick={handleCancelEdit}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="profile-save-button"
                                        disabled={saving}
                                    >
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        )}

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

                            {!showEditForm && (
                                <>
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
                                </>
                            )}

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

        </div>
    );
}

export default StudentDashboardPage;