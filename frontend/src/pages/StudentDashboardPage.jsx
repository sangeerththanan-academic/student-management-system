
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getStoredUser,
    logout
} from "../services/authService";

import apiRequest from "../services/api";
import ChangeStudentPassword from "../components/ChangeStudentPassword";

import "../styles/studentDashboard.css";

function StudentDashboardPage() {
    const navigate = useNavigate();

    const [user] = useState(getStoredUser());
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // CR-019: Edit Profile state
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState("");

    // CR-020: Change Password state
    const [showChangePassword, setShowChangePassword] = useState(false);

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
            } else {
                setError("No profile data found.");
            }
        } catch (err) {
            console.error("Failed to load profile:", err);

            if (err.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }

            setError(err.message || "Failed to load your profile.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    // CR-019: Open the form with existing profile values.
    const handleEditProfile = () => {
        setEmail(student?.email || "");
        setPhoneNumber(student?.phone_number || "");
        setProfileMessage("");
        setProfileError("");
        setShowEditProfile(true);
    };

    const handleCancelEdit = () => {
        setShowEditProfile(false);
        setProfileError("");
        setProfileMessage("");
    };

    // CR-019: Validate and save profile changes.
    const handleSaveProfile = async (event) => {
        event.preventDefault();

        setProfileMessage("");
        setProfileError("");

        const normalizedEmail = email.trim();
        const normalizedPhone = phoneNumber.trim();

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {
            setProfileError("Please enter a valid email address.");
            return;
        }

        if (!/^\d{10}$/.test(normalizedPhone)) {
            setProfileError(
                "Phone number must contain exactly 10 digits."
            );
            return;
        }

        try {
            setSavingProfile(true);

            const data = await apiRequest(
                "/api/students/me",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: normalizedEmail,
                        phoneNumber: normalizedPhone
                    })
                }
            );

            if (data.success === false) {
                throw new Error(
                    data.message || "Failed to update your profile."
                );
            }

            // Use the updated record returned by the backend.
            if (data.student) {
                setStudent(data.student);
            } else {
                await loadProfile();
            }

            setShowEditProfile(false);
            setProfileMessage(
                data.message || "Profile updated successfully."
            );
        } catch (err) {
            console.error("Failed to update profile:", err);

            if (err.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }

            setProfileError(
                err.message || "Failed to update your profile."
            );
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordFormClose = () => {
        setShowChangePassword(false);
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
                        type="button"
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
                    <div className="student-error" role="alert">
                        {error}
                    </div>
                )}

                {profileMessage && (
                    <div className="profile-success" role="status">
                        {profileMessage}
                    </div>
                )}

                {loading ? (
                    <div className="student-loading">
                        Loading your profile...
                    </div>
                ) : student ? (
                    <>
                        {/* Profile Details */}
                        <div className="profile-card">
                            <div className="profile-header">
                                <div className="profile-avatar">
                                    {student.first_name?.charAt(0)}
                                    {student.last_name?.charAt(0)}
                                </div>

                                <div className="profile-name">
                                    <h3>
                                        {student.first_name}{" "}
                                        {student.last_name}
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
                                        {student.first_name}{" "}
                                        {student.last_name}
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
                                            : "Not available"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* CR-019: Edit Profile */}
                        <div className="profile-action">
                            {!showEditProfile && (
                                <button
                                    type="button"
                                    className="edit-profile-button"
                                    onClick={handleEditProfile}
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {showEditProfile && (
                            <section className="edit-profile-card">
                                <h3>Edit Profile</h3>

                                <p className="edit-profile-description">
                                    Update your email address and phone
                                    number. Other profile details cannot
                                    be changed here.
                                </p>

                                {profileError && (
                                    <div
                                        className="student-error"
                                        role="alert"
                                    >
                                        {profileError}
                                    </div>
                                )}

                                <form onSubmit={handleSaveProfile}>
                                    <div className="profile-form-group">
                                        <label htmlFor="profile-email">
                                            Email Address
                                        </label>

                                        <input
                                            id="profile-email"
                                            type="email"
                                            value={email}
                                            onChange={(event) =>
                                                setEmail(event.target.value)
                                            }
                                            required
                                            maxLength={254}
                                            autoComplete="email"
                                            disabled={savingProfile}
                                        />
                                    </div>

                                    <div className="profile-form-group">
                                        <label htmlFor="profile-phone">
                                            Phone Number
                                        </label>

                                        <input
                                            id="profile-phone"
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(event) =>
                                                setPhoneNumber(
                                                    event.target.value
                                                )
                                            }
                                            required
                                            maxLength={10}
                                            inputMode="numeric"
                                            pattern="[0-9]{10}"
                                            title="Enter exactly 10 digits"
                                            autoComplete="tel"
                                            disabled={savingProfile}
                                        />
                                    </div>

                                    <div className="profile-form-actions">
                                        <button
                                            type="submit"
                                            className="save-profile-button"
                                            disabled={savingProfile}
                                        >
                                            {savingProfile
                                                ? "Saving..."
                                                : "Save Changes"}
                                        </button>

                                        <button
                                            type="button"
                                            className="cancel-profile-button"
                                            onClick={handleCancelEdit}
                                            disabled={savingProfile}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </section>
                        )}

                        {/* CR-020: Existing Change Password feature */}
                        <div className="change-password-toggle">
                            <button
                                type="button"
                                className="change-password-toggle-button"
                                onClick={() =>
                                    setShowChangePassword(
                                        (previous) => !previous
                                    )
                                }
                            >
                                {showChangePassword
                                    ? "Cancel Change Password"
                                    : "Change Password"}
                            </button>
                        </div>

                        {showChangePassword && (
                            <ChangeStudentPassword
                                onClose={handlePasswordFormClose}
                            />
                        )}
                    </>
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
