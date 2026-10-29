
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChangeStudentPassword from "../components/ChangeStudentPassword";



import ThemeToggle from "../components/ThemeToggle";

import {
    getStoredUser,
    logout
} from "../services/authService";

import apiRequest from "../services/api";
import "../styles/studentDashboard.css";

function StudentDashboardPage() {
    const navigate = useNavigate();

    // CR-019: Allow an authenticated student to update email and phone details.
    const user = getStoredUser();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [imageError, setImageError] = useState(false);
    const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
    const [profileForm, setProfileForm] = useState({
        email: "",
        phoneNumber: ""
    });
    const [profileFormError, setProfileFormError] = useState("");
    const [profileFormSuccess, setProfileFormSuccess] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);

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
                    setImageError(false);
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

    const openProfileEditor = () => {
        if (!student) return;

        setProfileForm({
            email: student.email || "",
            phoneNumber: String(student.phone_number || "")
        });
        setProfileFormError("");
        setProfileFormSuccess("");
        setIsProfileEditorOpen(true);
    };

    const closeProfileEditor = () => {
        setIsProfileEditorOpen(false);
        setProfileForm({ email: "", phoneNumber: "" });
        setProfileFormError("");
        setProfileFormSuccess("");
    };

    const handleProfileFieldChange = (event) => {
        const { name, value } = event.target;
        const sanitizedValue =
            name === "phoneNumber"
                ? value.replace(/\D/g, "").slice(0, 10)
                : value;

        setProfileForm((previous) => ({
            ...previous,
            [name]: sanitizedValue
        }));

        setProfileFormError("");
        setProfileFormSuccess("");
    };

    const validateProfileForm = () => {
        const errors = {};

        const email = profileForm.email.trim();
        const phoneNumber = profileForm.phoneNumber.trim();

        if (!email) {
            errors.email = "Email address is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Please enter a valid email address.";
        }

        if (!phoneNumber) {
            errors.phoneNumber = "Phone number is required.";
        } else if (!/^\d{10}$/.test(phoneNumber)) {
            errors.phoneNumber =
                "Phone number must contain exactly 10 digits.";
        }

        return errors;
    };

    const handleProfileSubmit = async (event) => {
        event.preventDefault();

        const validationErrors = validateProfileForm();

        if (Object.keys(validationErrors).length > 0) {
            setProfileFormError(
                "Please correct the validation errors before saving."
            );
            return;
        }

        try {
            setSavingProfile(true);
            setProfileFormError("");
            setProfileFormSuccess("");

            const response = await apiRequest(
                "/api/students/me",
                {
                    method: "PUT",
                    body: JSON.stringify({
                        email: profileForm.email.trim(),
                        phoneNumber: profileForm.phoneNumber.trim()
                    })
                }
            );

            setStudent((currentStudent) =>
                currentStudent
                    ? {
                          ...currentStudent,
                          email: response.student?.email || currentStudent.email,
                          phone_number:
                              response.student?.phone_number ||
                              currentStudent.phone_number
                      }
                    : currentStudent
            );

            setProfileFormSuccess(
                response.message || "Profile updated successfully."
            );

            setTimeout(() => {
                closeProfileEditor();
                setProfileFormSuccess("");
            }, 800);
        } catch (err) {
            console.error("Failed to update profile:", err);

            if (err.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }

            setProfileFormError(
                err.message || "Profile update failed."
            );
        } finally {
            setSavingProfile(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    // Photo paths are served by the backend, while VITE_API_URL may include /api.
    const configuredApiUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace(/\/+$/, "");
    const backendBaseUrl = configuredApiUrl.replace(/\/api$/i, "");

    const profileImageUrl = student?.profile_photo
        ? /^https?:\/\//i.test(student.profile_photo)
            ? student.profile_photo
            : `${backendBaseUrl}/${student.profile_photo
                .replace(/\\/g, "/")
                .replace(/^\/+/, "")}`
        : "";

    const initials = `${student?.first_name?.charAt(0) || ""}${student?.last_name?.charAt(0) || ""}`;

    return (
        <div className="student-dashboard-page">
            <header className="student-dashboard-header">
                <div>
                    <h1>Student Portal</h1>
                    <p>Welcome, {user?.username}</p>
                </div>

                <div className="student-header-actions">
                    <span className="role-badge">STUDENT</span>

                    <button
                        type="button"
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                    <ThemeToggle />
                </div>
            </header>

            <main className="student-dashboard-main">

                <div className="profile-header-actions">
                    <h2 className="section-title">My Profile</h2>
                    <button
                        type="button"
                        className="edit-profile-button"
                        onClick={openProfileEditor}
                        disabled={!student || savingProfile}
                    >
                        Edit Profile
                    </button>
                </div>

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
                            <div className="profile-avatar profile-photo">
                                {profileImageUrl && !imageError ? (
                                    <img
                                        src={profileImageUrl}
                                        alt={`${student.first_name} ${student.last_name}`}
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <span>{initials}</span>
                                )}
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
                                    {student.created_at
                                        ? new Date(
                                            student.created_at
                                        ).toLocaleDateString()
                                        : "N/A"}
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

                {isProfileEditorOpen && (
                    <div
                        className="profile-modal-overlay"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closeProfileEditor();
                            }
                        }}
                    >
                        <div
                            className="profile-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="profile-modal-title"
                        >
                            <div className="profile-modal-header">
                                <div>
                                    <h3 id="profile-modal-title">
                                        Edit Profile
                                    </h3>
                                    <p>
                                        Update your email address and phone number.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="profile-modal-close"
                                    onClick={closeProfileEditor}
                                    disabled={savingProfile}
                                    aria-label="Close profile editor"
                                >
                                    ×
                                </button>
                            </div>

                            {profileFormError && (
                                <div
                                    className="profile-form-message error"
                                    role="alert"
                                >
                                    {profileFormError}
                                </div>
                            )}
                            {profileFormSuccess && (
                                <div
                                    className="profile-form-message success"
                                    role="status"
                                >
                                    {profileFormSuccess}
                                </div>
                            )}

                            <form
                                className="profile-edit-form"
                                onSubmit={handleProfileSubmit}
                            >
                                <div className="profile-field">
                                    <label htmlFor="student-email-field">
                                        Email Address
                                    </label>
                                    <input
                                        id="student-email-field"
                                        name="email"
                                        type="email"
                                        value={profileForm.email}
                                        onChange={handleProfileFieldChange}
                                        autoComplete="email"
                                        required
                                        disabled={savingProfile}
                                    />
                                </div>
                                <div className="profile-field">
                                    <label htmlFor="student-phone-field">
                                        Phone Number
                                    </label>
                                    <input
                                        id="student-phone-field"
                                        name="phoneNumber"
                                        type="text"
                                        value={profileForm.phoneNumber}
                                        onChange={handleProfileFieldChange}
                                        inputMode="numeric"
                                        maxLength={10}
                                        autoComplete="tel"
                                        required
                                        disabled={savingProfile}
                                    />
                                </div>
                                <div className="profile-form-actions">
                                    <button
                                        type="button"
                                        className="profile-cancel-button"
                                        onClick={closeProfileEditor}
                                        disabled={savingProfile}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="profile-submit-button"
                                        disabled={savingProfile}
                                    >
                                        {savingProfile
                                            ? "Saving..."
                                            : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <ChangeStudentPassword />

            </main>
        </div>
    );
}

export default StudentDashboardPage;
