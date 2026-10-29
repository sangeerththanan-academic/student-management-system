
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


    // CR-019: Edit Profile (email and phone number)
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ email: "", phoneNumber: "" });
    const [editErrors, setEditErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [editMessage, setEditMessage] = useState("");
    const [editMessageType, setEditMessageType] = useState("");

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

    // ---------------------------------------------------------
    // CR-019: Edit Profile handlers
    // ---------------------------------------------------------

    const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const PHONE_PATTERN = /^\d{10}$/;

    const validateEditForm = (values) => {
        const errors = {};
        const email = values.email.trim();
        const phone = values.phoneNumber.trim();

        if (!email) {
            errors.email = "Email address is required";
        } else if (!EMAIL_PATTERN.test(email)) {
            errors.email = "Please enter a valid email address";
        }

        if (!phone) {
            errors.phoneNumber = "Phone number is required";
        } else if (!/^\d+$/.test(phone)) {
            errors.phoneNumber = "Phone number must contain numeric characters only";
        } else if (!PHONE_PATTERN.test(phone)) {
            errors.phoneNumber = "Phone number must contain exactly 10 digits";
        }

        return errors;
    };

    const handleEditStart = () => {
        setEditForm({
            email: student.email || "",
            phoneNumber: student.phone_number || ""
        });
        setEditErrors({});
        setEditMessage("");
        setEditMessageType("");
        setIsEditing(true);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditErrors({});
        setEditMessage("");
        setEditMessageType("");
    };

    const handleEditChange = (event) => {
        const { name, value } = event.target;

        setEditForm((previous) => ({ ...previous, [name]: value }));
        setEditErrors((previous) => ({ ...previous, [name]: "" }));
        setEditMessage("");
        setEditMessageType("");
    };

    const handleEditSubmit = async (event) => {
        event.preventDefault();

        const errors = validateEditForm(editForm);

        if (Object.keys(errors).length > 0) {
            setEditErrors(errors);
            setEditMessage(errors.email || errors.phoneNumber);
            setEditMessageType("error");
            return;
        }

        try {
            setSaving(true);
            setEditMessage("");
            setEditMessageType("");

            // No student ID is sent - the server identifies the
            // student from the JWT.
            const data = await apiRequest("/api/students/me", {
                method: "PUT",
                body: JSON.stringify({
                    email: editForm.email.trim(),
                    phoneNumber: editForm.phoneNumber.trim()
                })
            });

            // Refresh displayed profile with the saved values
            if (data.student) {
                setStudent(data.student);
            } else {
                setStudent((previous) => ({
                    ...previous,
                    email: editForm.email.trim(),
                    phone_number: editForm.phoneNumber.trim()
                }));
            }

            setIsEditing(false);
            setEditErrors({});
            setEditMessage(data.message || "Profile updated successfully");
            setEditMessageType("success");
        } catch (err) {
            if (err.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }

            setEditMessage(err.message || "Failed to update profile");
            setEditMessageType("error");
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
                    <div className="student-error">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="student-loading">
                        Loading your profile...
                    </div>
                ) : student ? (
                    <>
                        {/* CR-019: Success message after saving */}
                        {!isEditing && editMessage && (
                            <div
                                className={`profile-edit-notification ${editMessageType}`}
                                role="status"
                                aria-live="polite"
                            >
                                {editMessage}
                            </div>
                        )}

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

                                {/* CR-019: Edit Profile button */}
                                {!isEditing && (
                                    <button
                                        type="button"
                                        className="edit-profile-button"
                                        onClick={handleEditStart}
                                    >
                                        Edit Profile
                                    </button>
                                )}
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

                            {/* CR-019: Edit Profile form */}
                            {isEditing && (
                                <form
                                    className="profile-edit-form"
                                    onSubmit={handleEditSubmit}
                                    noValidate
                                >
                                    <h4>Edit Profile</h4>
                                    <p className="profile-edit-hint">
                                        You can update your email address and phone number.
                                    </p>

                                    {editMessage && editMessageType === "error" && (
                                        <div
                                            className="profile-edit-notification error"
                                            role="alert"
                                        >
                                            {editMessage}
                                        </div>
                                    )}

                                    <div className="profile-edit-field">
                                        <label htmlFor="editEmail">
                                            Email
                                        </label>
                                        <input
                                            id="editEmail"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            value={editForm.email}
                                            onChange={handleEditChange}
                                            disabled={saving}
                                            aria-invalid={Boolean(editErrors.email)}
                                            className={editErrors.email ? "input-invalid" : ""}
                                        />
                                        {editErrors.email && (
                                            <small className="profile-edit-error">
                                                {editErrors.email}
                                            </small>
                                        )}
                                    </div>

                                    <div className="profile-edit-field">
                                        <label htmlFor="editPhone">
                                            Phone Number
                                        </label>
                                        <input
                                            id="editPhone"
                                            name="phoneNumber"
                                            type="tel"
                                            inputMode="numeric"
                                            autoComplete="tel"
                                            maxLength={10}
                                            value={editForm.phoneNumber}
                                            onChange={handleEditChange}
                                            disabled={saving}
                                            aria-invalid={Boolean(editErrors.phoneNumber)}
                                            className={editErrors.phoneNumber ? "input-invalid" : ""}
                                        />
                                        {editErrors.phoneNumber && (
                                            <small className="profile-edit-error">
                                                {editErrors.phoneNumber}
                                            </small>
                                        )}
                                    </div>

                                    <div className="profile-edit-actions">
                                        <button
                                            type="submit"
                                            className="profile-save-button"
                                            disabled={saving}
                                        >
                                            {saving ? "Saving..." : "Save Changes"}
                                        </button>
                                        <button
                                            type="button"
                                            className="profile-cancel-button"
                                            onClick={handleEditCancel}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
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
