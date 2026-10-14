import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getStoredUser,
    logout
} from "../services/authService";

import apiRequest from "../services/api";

import StudentFormModal from "../components/StudentFormModal";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../context/useTheme";

import "../styles/studentDashboard.css";

function StudentDashboardPage() {
    const navigate = useNavigate();
    const { theme } = useTheme();

    const [user, setUser] = useState(getStoredUser());
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showProfileEditor, setShowProfileEditor] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState("");

    const profilePhotoKey = student?.student_id
        ? `student-profile-photo-${student.student_id}` 
        : "student-profile-photo";

    useEffect(() => {
        if (!student) return;

        const storedPhoto = localStorage.getItem(profilePhotoKey);
        if (storedPhoto) {
            setProfilePhoto(storedPhoto);
        } else {
            setProfilePhoto("");
        }
    }, [student, profilePhotoKey]);

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

    useEffect(() => {
        loadProfile();
    }, [navigate]);

    const handleOpenProfileEditor = () => {
        if (student) {
            setShowProfileEditor(true);
        }
    };

    const handleProfileEditorClose = () => {
        setShowProfileEditor(false);
    };

    const handleProfileAuthError = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const handleProfilePhotoChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const imageData = String(reader.result || "");
            setProfilePhoto(imageData);
            localStorage.setItem(profilePhotoKey, imageData);
            setError("");
        };
        reader.readAsDataURL(file);

        event.target.value = "";
    };

    const handleRemoveProfilePhoto = () => {
        setProfilePhoto("");
        localStorage.removeItem(profilePhotoKey);
    };

    return (
        <div className={`student-dashboard-page theme-${theme}`}>

            <main className="student-dashboard-main">

                <div className="student-page-heading">
                    <h2 className="section-title">My Profile</h2>
                    <ThemeToggle />
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
                            <div className="profile-header-main">
                                <div className="profile-avatar-wrapper">
                                    <div className="profile-avatar">
                                        {profilePhoto ? (
                                            <img
                                                src={profilePhoto}
                                                alt="Profile"
                                                className="profile-avatar-image"
                                            />
                                        ) : (
                                            <>
                                                {student.first_name?.charAt(0) || "S"}
                                                {student.last_name?.charAt(0) || "F"}
                                            </>
                                        )}
                                    </div>

                                    <div className="profile-avatar-actions">
                                        <label
                                            htmlFor="profile-photo-upload"
                                            className="profile-photo-option"
                                        >
                                            Change Photo
                                        </label>
                                        {profilePhoto && (
                                            <button
                                                type="button"
                                                className="profile-photo-option danger"
                                                onClick={handleRemoveProfilePhoto}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <input
                                        id="profile-photo-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfilePhotoChange}
                                        hidden
                                    />
                                </div>
                                <div className="profile-name">
                                    <h3>
                                        {student.first_name} {student.last_name}
                                    </h3>
                                    <p>{student.registration_no}</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="edit-profile-button"
                                onClick={handleOpenProfileEditor}
                            >
                                Edit Profile
                            </button>
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

            {student && (
                <StudentFormModal
                    show={showProfileEditor}
                    editingStudent={student}
                    onClose={handleProfileEditorClose}
                    onSuccess={async () => {
                        await loadProfile();
                        setShowProfileEditor(false);
                    }}
                    onAuthError={handleProfileAuthError}
                />
            )}

        </div>
    );
}

export default StudentDashboardPage;