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

    const [user] = useState(getStoredUser());
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [contactDetails, setContactDetails] = useState({
        email: "",
        phoneNumber: ""
    });

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

    const handleEdit = () => {
        setContactDetails({
            email: student.email || "",
            phoneNumber: student.phone_number || ""
        });
        setError("");
        setSuccess("");
        setEditing(true);
    };

    const handleCancelEdit = () => {
        setEditing(false);
        setError("");
    };

    const handleContactChange = (event) => {
        const { name, value } = event.target;
        setContactDetails((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSaveProfile = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        try {
            setSaving(true);
            const data = await apiRequest("/api/students/me", {
                method: "PUT",
                body: JSON.stringify({
                    email: contactDetails.email.trim(),
                    phoneNumber: contactDetails.phoneNumber.trim()
                })
            });

            setStudent(data.student);
            setEditing(false);
            setSuccess("Your profile has been updated.");
        } catch (err) {
            console.error("Failed to update profile:", err);

            if (err.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }

            if (err.status === 403) {
                setError("You do not have permission to update this profile.");
            } else {
                setError(err.message || "Failed to update your profile.");
            }
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
                    <div className="student-error" role="alert">
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

                            {editing ? (
                                <form
                                    className="profile-contact-form"
                                    onSubmit={handleSaveProfile}
                                >
                                    <div className="detail-row">
                                        <label
                                            className="detail-label"
                                            htmlFor="profile-email"
                                        >
                                            Email
                                        </label>
                                        <input
                                            className="profile-input"
                                            id="profile-email"
                                            type="email"
                                            name="email"
                                            value={contactDetails.email}
                                            onChange={handleContactChange}
                                            maxLength={150}
                                            autoComplete="email"
                                            required
                                            disabled={saving}
                                        />
                                    </div>

                                    <div className="detail-row">
                                        <label
                                            className="detail-label"
                                            htmlFor="profile-phone"
                                        >
                                            Phone
                                        </label>
                                        <input
                                            className="profile-input"
                                            id="profile-phone"
                                            type="tel"
                                            name="phoneNumber"
                                            value={contactDetails.phoneNumber}
                                            onChange={handleContactChange}
                                            maxLength={20}
                                            autoComplete="tel"
                                            required
                                            disabled={saving}
                                        />
                                    </div>

                                    <div className="profile-actions">
                                        <button
                                            className="profile-save-button"
                                            type="submit"
                                            disabled={saving}
                                        >
                                            {saving ? "Saving..." : "Save changes"}
                                        </button>
                                        <button
                                            className="profile-cancel-button"
                                            type="button"
                                            onClick={handleCancelEdit}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
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

                            {!editing && (
                                <div className="profile-actions">
                                    <button
                                        className="profile-edit-button"
                                        type="button"
                                        onClick={handleEdit}
                                    >
                                        Edit contact details
                                    </button>
                                </div>
                            )}
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