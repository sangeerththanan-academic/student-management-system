
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

    // CR-019: Profile editing states
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        email: "",
        phone_number: ""
    });
    const [profileErrors, setProfileErrors] = useState({});
    const [profileMessage, setProfileMessage] = useState("");
    const [profileMessageType, setProfileMessageType] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);

    // Load authenticated student's profile
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
                setStudent(null);
                setError("Student profile not found.");
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

    // Open the profile editing form
    const handleEditProfile = () => {
        setProfileForm({
            email: student.email || "",
            phone_number: student.phone_number || ""
        });

        setProfileErrors({});
        setProfileMessage("");
        setProfileMessageType("");
        setIsEditingProfile(true);
    };

    // Handle changes to email and phone fields
    const handleProfileInputChange = (event) => {
        const { name, value } = event.target;

        setProfileForm((previous) => ({
            ...previous,
            [name]: value
        }));

        setProfileErrors((previous) => ({
            ...previous,
            [name]: ""
        }));

        setProfileMessage("");
        setProfileMessageType("");
    };

    // Client-side validation
    const validateProfileForm = () => {
        const errors = {};

        const email = profileForm.email.trim();
        const phone = profileForm.phone_number.trim();

        if (!email) {
            errors.email = "Email address is required.";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            errors.email = "Please enter a valid email address.";
        } else if (email.length > 254) {
            errors.email = "Email address is too long.";
        }

        if (!phone) {
            errors.phone_number = "Phone number is required.";
        } else if (!/^\d{10}$/.test(phone)) {
            errors.phone_number =
                "Phone number must contain exactly 10 digits.";
        }

        setProfileErrors(errors);

        return Object.keys(errors).length === 0;
    };

    // Save updated email and phone number
    const handleSaveProfile = async (event) => {
        event.preventDefault();

        setProfileMessage("");
        setProfileMessageType("");

        if (!validateProfileForm()) {
            return;
        }

        try {
            setSavingProfile(true);

            const data = await apiRequest(
                "/api/students/me",
                {
                    method: "PUT",
                    body: JSON.stringify({
                        email: profileForm.email.trim(),
                        phoneNumber: profileForm.phone_number.trim()
                    })
                }
            );

            setProfileMessage(
                data.message || "Profile updated successfully."
            );
            setProfileMessageType("success");

            // Refresh the profile from the server
            const updatedProfile = await apiRequest(
                "/api/students/me",
                { method: "GET" }
            );

            if (updatedProfile.student) {
                setStudent(updatedProfile.student);
            }

            setIsEditingProfile(false);
            setProfileErrors({});
        } catch (err) {
            console.error("Failed to update profile:", err);

            if (err.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }

            setProfileMessage(
                err.message || "Failed to update your profile."
            );
            setProfileMessageType("error");
        } finally {
            setSavingProfile(false);
        }
    };

    // Cancel editing without saving
    const handleCancelEdit = () => {
        setProfileForm({
            email: student?.email || "",
            phone_number: student?.phone_number || ""
        });

        setProfileErrors({});
        setProfileMessage("");
        setProfileMessageType("");
        setIsEditingProfile(false);
    };

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

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
                </div>
            </header>

            <main className="student-dashboard-main">
                <h2 className="section-title">My Profile</h2>

                {error && (
                    <div className="student-error" role="alert">
                        {error}
                    </div>
                )}

                {profileMessage && (
                    <div
                        className={`profile-notification ${profileMessageType}`}
                        role={profileMessageType === "error" ? "alert" : "status"}
                    >
                        {profileMessage}
                    </div>
                )}

                {loading ? (
                    <div className="student-loading">
                        Loading your profile...
                    </div>
                ) : student ? (
                    <>
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

                            {!isEditingProfile ? (
                                <>
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

                                    <div className="profile-action-area">
                                        <button
                                            type="button"
                                            className="edit-profile-button"
                                            onClick={handleEditProfile}
                                        >
                                            Edit Profile
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <form
                                    className="profile-edit-form"
                                    onSubmit={handleSaveProfile}
                                    noValidate
                                >
                                    <div className="profile-edit-heading">
                                        <h3>Edit Profile</h3>
                                        <p>
                                            Update your email address and
                                            phone number below.
                                        </p>
                                    </div>

                                    <div className="profile-form-group">
                                        <label htmlFor="profile-email">
                                            Email Address
                                        </label>

                                        <input
                                            id="profile-email"
                                            type="email"
                                            name="email"
                                            value={profileForm.email}
                                            onChange={handleProfileInputChange}
                                            placeholder="Enter your email address"
                                            maxLength={254}
                                            autoComplete="email"
                                            disabled={savingProfile}
                                            aria-invalid={Boolean(
                                                profileErrors.email
                                            )}
                                            aria-describedby={
                                                profileErrors.email
                                                    ? "profile-email-error"
                                                    : undefined
                                            }
                                        />

                                        {profileErrors.email && (
                                            <span
                                                id="profile-email-error"
                                                className="profile-field-error"
                                            >
                                                {profileErrors.email}
                                            </span>
                                        )}
                                    </div>

                                    <div className="profile-form-group">
                                        <label htmlFor="profile-phone">
                                            Phone Number
                                        </label>

                                        <input
                                            id="profile-phone"
                                            type="tel"
                                            name="phone_number"
                                            value={profileForm.phone_number}
                                            onChange={handleProfileInputChange}
                                            placeholder="Enter 10-digit phone number"
                                            maxLength={10}
                                            inputMode="numeric"
                                            autoComplete="tel"
                                            disabled={savingProfile}
                                            aria-invalid={Boolean(
                                                profileErrors.phone_number
                                            )}
                                            aria-describedby={
                                                profileErrors.phone_number
                                                    ? "profile-phone-error"
                                                    : undefined
                                            }
                                        />

                                        {profileErrors.phone_number && (
                                            <span
                                                id="profile-phone-error"
                                                className="profile-field-error"
                                            >
                                                {profileErrors.phone_number}
                                            </span>
                                        )}
                                    </div>

                                    <div className="profile-edit-actions">
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
                            )}
                        </div>

                        {/* CR-020: Change Student Password */}
                        <ChangeStudentPassword
                            studentId={student.student_id}
                        />
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
