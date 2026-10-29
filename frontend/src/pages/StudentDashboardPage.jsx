import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import ChangeStudentPassword from "../components/ChangeStudentPassword";

import {
    getStoredUser,
    logout
} from "../services/authService";

import apiRequest from "../services/api";

import "../styles/studentDashboard.css";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

// Convert the saved image path into a complete URL.
const getProfileImageUrl = (profileImage) => {
    if (!profileImage) {
        return null;
    }

    if (
        profileImage.startsWith("http://") ||
        profileImage.startsWith("https://")
    ) {
        return profileImage;
    }

    return `${API_BASE_URL}${profileImage.startsWith("/") ? "" : "/"}${profileImage}`;
};

function StudentDashboardPage() {
    const navigate = useNavigate();

    const [user, setUser] = useState(getStoredUser());
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [imageError, setImageError] = useState(false);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phoneNumber: "" });

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

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const openEditor = () => {
        setFormData({ firstName: student.first_name || "", lastName: student.last_name || "", email: student.email || "", phoneNumber: student.phone_number || "" });
        setFormError("");
        setEditing(true);
    };

    const handleProfileSubmit = async (event) => {
        event.preventDefault();
        setFormError("");
        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim();
        const phoneNumber = formData.phoneNumber.trim();

        if (!firstName || !lastName || !email || !phoneNumber) {
            setFormError("Please complete all profile fields.");
            return;
        }
        if (firstName.length < 3 || !/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(firstName)) {
            setFormError("Enter a valid first name (at least 3 characters).");
            return;
        }
        if (lastName.length < 3 || !/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(lastName)) {
            setFormError("Enter a valid last name (at least 3 characters).");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setFormError("Enter a valid email address.");
            return;
        }
        if (!/^\d{10}$/.test(phoneNumber)) {
            setFormError("Phone number must contain exactly 10 digits.");
            return;
        }

        try {
            setSaving(true);
            const result = await apiRequest("/api/students/me", {
                method: "PUT",
                body: JSON.stringify({ firstName, lastName, email, phoneNumber })
            });
            setStudent(result.student);
            setEditing(false);
        } catch (err) {
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

    const profileImageUrl = getProfileImageUrl(
        student?.profile_photo
    );

    const showProfileImage =
        Boolean(profileImageUrl) && !imageError;

    const getInitials = () => {
        const firstInitial = student?.first_name?.charAt(0) || "";
        const lastInitial = student?.last_name?.charAt(0) || "";

        return `${firstInitial}${lastInitial}`.toUpperCase();
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

                        <div className="profile-edit-actions">
                            <button type="button" className="profile-edit-button" onClick={openEditor}>
                                Edit Profile
                            </button>
                        </div>

                        {/* Profile Image and Name */}
                        <div className="profile-header">

                            <div className="profile-avatar">
                                {showProfileImage ? (
                                    <img
                                        src={profileImageUrl}
                                        alt={`${student.first_name} ${student.last_name}`}
                                        className="student-profile-image"
                                        onError={() => {
                                            setImageError(true);
                                        }}
                                    />
                                ) : (
                                    <span className="profile-avatar-initials">
                                        {getInitials()}
                                    </span>
                                )}
                            </div>

                            <div className="profile-name">
                                <h3>
                                    {student.first_name}{" "}
                                    {student.last_name}
                                </h3>

                                <p>{student.registration_no}</p>
                            </div>

                        </div>

                        {/* Profile Details */}
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
                                        : "-"}
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

                {user?.role === "STUDENT" && user?.id && (
                    <ChangeStudentPassword userId={user.id} />
                )}

                {editing && (
                    <div className="profile-modal-overlay" onClick={() => !saving && setEditing(false)}>
                        <section className="profile-edit-modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title" onClick={(event) => event.stopPropagation()}>
                            <h2 id="profile-edit-title">Edit My Profile</h2>
                            <p className="profile-edit-note">Registration number cannot be changed here.</p>
                            {formError && <div className="student-error" role="alert">{formError}</div>}
                            <form onSubmit={handleProfileSubmit}>
                                {[["First Name", "firstName", "text"], ["Last Name", "lastName", "text"], ["Email", "email", "email"], ["Phone Number", "phoneNumber", "tel"]].map(([label, name, type]) => (
                                    <label className="profile-edit-field" key={name}>
                                        {label}
                                        <input type={type} value={formData[name]} onChange={(event) => setFormData((current) => ({ ...current, [name]: event.target.value }))} disabled={saving} required />
                                    </label>
                                ))}
                                <div className="profile-edit-buttons">
                                    <button type="button" className="profile-cancel-button" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
                                    <button type="submit" className="profile-edit-button" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                                </div>
                            </form>
                        </section>
                    </div>
                )}

            </main>

        </div>
    );
}

export default StudentDashboardPage;
