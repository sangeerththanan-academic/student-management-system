
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getStoredUser,
    logout
} from "../services/authService";

import apiRequest, {
    API_BASE_URL
} from "../services/api";

import "../styles/studentDashboard.css";

function StudentDashboardPage() {
    const navigate = useNavigate();

    const [user] = useState(getStoredUser());
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [profileImageError, setProfileImageError] = useState(false);

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
                    setProfileImageError(false);
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

    const getProfileImageUrl = () => {
        if (!student?.profile_photo) {
            return "";
        }

        const photo = student.profile_photo;

        if (/^https?:\/\//i.test(photo)) {
            return photo;
        }

        return `${API_BASE_URL}/${photo.replace(/^\/+/, "")}`;
    };

    const initials = (
        `${student?.first_name?.charAt(0) || ""}` +
        `${student?.last_name?.charAt(0) || ""}`
    ) || "?";

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
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </header>

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
                            {student.profile_photo &&
                            !profileImageError ? (
                                <img
                                    className="profile-avatar-image"
                                    src={getProfileImageUrl()}
                                    alt={`${student.first_name} ${student.last_name}`}
                                    onError={() => {
                                        console.error(
                                            "Profile image could not be loaded:",
                                            getProfileImageUrl()
                                        );
                                        setProfileImageError(true);
                                    }}
                                />
                            ) : (
                                <div className="profile-avatar">
                                    {initials}
                                </div>
                            )}

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
            </main>
        </div>
    );
}

export default StudentDashboardPage;
