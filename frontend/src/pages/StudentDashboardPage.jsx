import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getStoredUser,
    logout,
    changePassword
} from "../services/authService";

import apiRequest from "../services/api";

import "../styles/studentDashboard.css";

function StudentDashboardPage() {
    const navigate = useNavigate();

    const [user] = useState(getStoredUser());
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordFields, setPasswordFields] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);

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

    const handlePasswordChange = async (event) => {
        event.preventDefault();
        setPasswordMessage("");
        setPasswordError("");

        if (passwordFields.newPassword !== passwordFields.confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        try {
            setPasswordSubmitting(true);
            const data = await changePassword(
                passwordFields.oldPassword,
                passwordFields.newPassword,
                passwordFields.confirmPassword
            );
            setPasswordFields({
                oldPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
            setPasswordMessage(data.message || "Password changed successfully.");
        } catch (err) {
            setPasswordError(err.message || "Failed to change password.");
        } finally {
            setPasswordSubmitting(false);
        }
    };

    const handlePasswordFieldChange = (event) => {
        const { name, value } = event.target;
        setPasswordFields((fields) => ({ ...fields, [name]: value }));
        setPasswordMessage("");
        setPasswordError("");
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

                {showPasswordForm ? (
                    <section className="password-card">
                        <div className="password-card-header">
                            <div>
                                <h3>Change password</h3>
                                <p>Enter your current password and choose a new one.</p>
                            </div>
                            <button
                                className="profile-back-button"
                                type="button"
                                onClick={() => setShowPasswordForm(false)}
                            >
                                Back to profile
                            </button>
                        </div>

                        {passwordMessage && (
                            <div className="password-success" role="status">
                                {passwordMessage}
                            </div>
                        )}
                        {passwordError && (
                            <div className="student-error" role="alert">
                                {passwordError}
                            </div>
                        )}

                        <form className="password-form" onSubmit={handlePasswordChange}>
                            <label htmlFor="oldPassword">Old password</label>
                            <input
                                id="oldPassword"
                                name="oldPassword"
                                type="password"
                                autoComplete="current-password"
                                value={passwordFields.oldPassword}
                                onChange={handlePasswordFieldChange}
                                required
                            />

                            <label htmlFor="newPassword">New password</label>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                autoComplete="new-password"
                                value={passwordFields.newPassword}
                                onChange={handlePasswordFieldChange}
                                required
                            />

                            <label htmlFor="confirmPassword">Re-enter new password</label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                value={passwordFields.confirmPassword}
                                onChange={handlePasswordFieldChange}
                                required
                            />

                            <button
                                className="password-submit-button"
                                type="submit"
                                disabled={passwordSubmitting}
                            >
                                {passwordSubmitting ? "Updating..." : "Update password"}
                            </button>
                        </form>
                    </section>
                ) : loading ? (
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

                        <div className="profile-security">
                            <span>Account security</span>
                            <button
                                className="change-password-button"
                                type="button"
                                onClick={() => {
                                    setShowPasswordForm(true);
                                    setPasswordMessage("");
                                    setPasswordError("");
                                }}
                            >
                                Change password
                            </button>
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