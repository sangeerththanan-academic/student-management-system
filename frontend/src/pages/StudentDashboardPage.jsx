<<<<<<< HEAD
=======
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// import {
//     getStoredUser,
//     logout
// } from "../services/authService";

// import apiRequest from "../services/api";

// import "../styles/studentDashboard.css";

// const API_BASE_URL =
//     import.meta.env.VITE_API_URL || "http://localhost:5000";

// // Convert the saved image path into a complete URL.
// const getProfileImageUrl = (profileImage) => {
//     if (!profileImage) {
//         return null;
//     }

//     if (
//         profileImage.startsWith("http://") ||
//         profileImage.startsWith("https://")
//     ) {
//         return profileImage;
//     }

//     return `${API_BASE_URL}${profileImage.startsWith("/") ? "" : "/"}${profileImage}`;
// };

// function StudentDashboardPage() {
//     const navigate = useNavigate();

//     const [user, setUser] = useState(getStoredUser());
//     const [student, setStudent] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");
//     const [imageError, setImageError] = useState(false);

//     useEffect(() => {
//         const loadProfile = async () => {
//             try {
//                 setLoading(true);
//                 setError("");

//                 const data = await apiRequest(
//                     "/api/students/me",
//                     { method: "GET" }
//                 );

//                 if (data.student) {
//                     setStudent(data.student);
//                     setImageError(false);
//                 }
//             } catch (err) {
//                 console.error("Failed to load profile:", err);

//                 if (err.status === 401) {
//                     logout();
//                     navigate("/login", { replace: true });
//                     return;
//                 }

//                 setError(
//                     err.message || "Failed to load your profile."
//                 );
//             } finally {
//                 setLoading(false);
//             }
//         };

//         loadProfile();
//     }, [navigate]);

//     const handleLogout = () => {
//         logout();
//         navigate("/login", { replace: true });
//     };

//     const profileImageUrl = getProfileImageUrl(
//         student?.profile_image
//     );

//     const showProfileImage =
//         Boolean(profileImageUrl) && !imageError;

//     const getInitials = () => {
//         const firstInitial = student?.first_name?.charAt(0) || "";
//         const lastInitial = student?.last_name?.charAt(0) || "";

//         return `${firstInitial}${lastInitial}`.toUpperCase();
//     };

//     return (
//         <div className="student-dashboard-page">

//             {/* Header */}
//             <header className="student-dashboard-header">
//                 <div>
//                     <h1>Student Portal</h1>
//                     <p>Welcome, {user?.username}</p>
//                 </div>

//                 <div className="student-header-actions">
//                     <span className="role-badge">STUDENT</span>

//                     <button
//                         className="logout-button"
//                         onClick={handleLogout}
//                     >
//                         Logout
//                     </button>
//                 </div>
//             </header>

//             {/* Main Content */}
//             <main className="student-dashboard-main">

//                 <h2 className="section-title">My Profile</h2>

//                 {error && (
//                     <div className="student-error">
//                         {error}
//                     </div>
//                 )}

//                 {loading ? (
//                     <div className="student-loading">
//                         Loading your profile...
//                     </div>
//                 ) : student ? (
//                     <div className="profile-card">

//                         {/* Profile Image and Name */}
//                         <div className="profile-header">

//                             <div className="profile-avatar">
//                                 {showProfileImage ? (
//                                     <img
//                                         src={profileImageUrl}
//                                         alt={`${student.first_name} ${student.last_name}`}
//                                         className="student-profile-image"
//                                         onError={() => {
//                                             setImageError(true);
//                                         }}
//                                     />
//                                 ) : (
//                                     <span className="profile-avatar-initials">
//                                         {getInitials()}
//                                     </span>
//                                 )}
//                             </div>

//                             <div className="profile-name">
//                                 <h3>
//                                     {student.first_name}{" "}
//                                     {student.last_name}
//                                 </h3>

//                                 <p>{student.registration_no}</p>
//                             </div>

//                         </div>

//                         {/* Profile Details */}
//                         <div className="profile-details">

//                             <div className="detail-row">
//                                 <span className="detail-label">
//                                     Registration No
//                                 </span>

//                                 <span className="detail-value">
//                                     {student.registration_no}
//                                 </span>
//                             </div>

//                             <div className="detail-row">
//                                 <span className="detail-label">
//                                     Full Name
//                                 </span>

//                                 <span className="detail-value">
//                                     {student.first_name}{" "}
//                                     {student.last_name}
//                                 </span>
//                             </div>

//                             <div className="detail-row">
//                                 <span className="detail-label">
//                                     Email
//                                 </span>

//                                 <span className="detail-value">
//                                     {student.email}
//                                 </span>
//                             </div>

//                             <div className="detail-row">
//                                 <span className="detail-label">
//                                     Phone
//                                 </span>

//                                 <span className="detail-value">
//                                     {student.phone_number}
//                                 </span>
//                             </div>

//                             <div className="detail-row">
//                                 <span className="detail-label">
//                                     Member Since
//                                 </span>

//                                 <span className="detail-value">
//                                     {student.created_at
//                                         ? new Date(
//                                             student.created_at
//                                         ).toLocaleDateString()
//                                         : "-"}
//                                 </span>
//                             </div>

//                         </div>

//                     </div>
//                 ) : (
//                     !error && (
//                         <div className="student-loading">
//                             No profile data found.
//                         </div>
//                     )
//                 )}

//             </main>

//         </div>
//     );
// }

// export default StudentDashboardPage;

>>>>>>> JFICT32/CR026

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ChangeStudentPassword from "../components/ChangeStudentPassword";

import {
    getStoredUser,
    logout
} from "../services/authService";

import apiRequest from "../services/api";

import "../styles/studentDashboard.css";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

// Convert saved image path into a complete URL.
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

    return `${API_BASE_URL}${
        profileImage.startsWith("/") ? "" : "/"
    }${profileImage}`;
};

function StudentDashboardPage() {
    const navigate = useNavigate();

    const [user] = useState(getStoredUser());
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
<<<<<<< HEAD
    const [success, setSuccess] = useState("");

    const [isEditing, setIsEditing] = useState(false);
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState("");

    // Load the logged-in student's profile
    const loadProfile = async () => {
        const data = await apiRequest(
            "/api/students/me",
            { method: "GET" }
        );

        if (data.student) {
            setStudent(data.student);
            setEmail(data.student.email || "");
            setPhoneNumber(data.student.phone_number || "");
        }

        return data.student;
    };
=======
    const [imageError, setImageError] = useState(false);
>>>>>>> JFICT32/CR026

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError("");

<<<<<<< HEAD
                await loadProfile();
=======
                const data = await apiRequest(
                    "/api/students/me",
                    { method: "GET" }
                );

                if (data.student) {
                    setStudent(data.student);
                    setImageError(false);
                }
>>>>>>> JFICT32/CR026
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

        fetchProfile();
    }, [navigate]);

    // Open the edit form
    const handleEdit = () => {
        setEmail(student.email || "");
        setPhoneNumber(student.phone_number || "");
        setValidationError("");
        setError("");
        setSuccess("");
        setIsEditing(true);
    };

    // Cancel editing
    const handleCancel = () => {
        setEmail(student.email || "");
        setPhoneNumber(student.phone_number || "");
        setValidationError("");
        setError("");
        setIsEditing(false);
    };

    // Save updated email and phone number
    const handleSave = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");
        setValidationError("");

        const trimmedEmail = email.trim();
        const trimmedPhone = phoneNumber.trim();

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phonePattern = /^\d{10}$/;

        if (!emailPattern.test(trimmedEmail)) {
            setValidationError(
                "Please enter a valid email address."
            );
            return;
        }

        if (!phonePattern.test(trimmedPhone)) {
            setValidationError(
                "Phone number must contain exactly 10 digits."
            );
            return;
        }

        try {
            setSaving(true);

            const data = await apiRequest(
                "/api/students/me",
                {
                    method: "PUT",
                    body: JSON.stringify({
                        email: trimmedEmail,
                        phoneNumber: trimmedPhone
                    })
                }
            );

            // Immediately show the updated profile returned by the API
            if (data.student) {
                setStudent(data.student);
                setEmail(data.student.email || trimmedEmail);
                setPhoneNumber(
                    data.student.phone_number || trimmedPhone
                );
            }

            setIsEditing(false);
            setSuccess(
                data.message || "Profile updated successfully."
            );

            // Refresh the profile from the server
            try {
                await loadProfile();
            } catch (refreshError) {
                console.error(
                    "Profile refresh failed:",
                    refreshError
                );

                // The update itself succeeded. Keep the updated data
                // returned by the PUT request.
                if (refreshError.status === 401) {
                    logout();
                    navigate("/login", { replace: true });
                    return;
                }
            }
        } catch (err) {
            console.error("Failed to update profile:", err);

            if (err.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }

            setError(
                err.message || "Failed to update your profile."
            );
        } finally {
            setSaving(false);
        }
    };

    // Logout
    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const profileImageUrl = getProfileImageUrl(
        student?.profile_image
    );

    const showProfileImage =
        Boolean(profileImageUrl) && !imageError;

    const getInitials = () => {
        const firstInitial =
            student?.first_name?.charAt(0) || "";

        const lastInitial =
            student?.last_name?.charAt(0) || "";

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
<<<<<<< HEAD
                    <span className="role-badge">STUDENT</span>
=======
                    <span className="role-badge">
                        STUDENT
                    </span>
>>>>>>> JFICT32/CR026

                    <button
                        type="button"
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content: My Profile */}
            <main className="student-dashboard-main">

                <h2 className="section-title">
                    My Profile
                </h2>

                {error && (
                    <div className="student-error" role="alert">
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        className="student-success"
                        role="status"
                    >
                        {success}
                    </div>
                )}

                {loading ? (
                    <div className="student-loading">
                        Loading your profile...
                    </div>
                ) : student ? (
                    <div className="profile-card">

<<<<<<< HEAD
                        {/* Student Information */}
=======
                        {/* Profile Image and Name */}
>>>>>>> JFICT32/CR026
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

                                <p>
                                    {student.registration_no}
                                </p>
                            </div>
                        </div>

<<<<<<< HEAD
                        {/* Edit Profile Button */}
                        {!isEditing && (
                            <div className="profile-actions">
                                <button
                                    type="button"
                                    className="edit-profile-button"
                                    onClick={handleEdit}
                                >
                                    Edit Profile
                                </button>
                            </div>
                        )}

                        {/* Edit Form */}
                        {isEditing && (
                            <form
                                className="profile-edit-form"
                                onSubmit={handleSave}
                            >
                                <h3>Edit Profile</h3>

                                <div className="form-group">
                                    <label htmlFor="profileEmail">
                                        Email Address
                                    </label>

                                    <input
                                        id="profileEmail"
                                        type="email"
                                        value={email}
                                        onChange={(event) => {
                                            setEmail(event.target.value);
                                            setValidationError("");
                                            setError("");
                                            setSuccess("");
                                        }}
                                        placeholder="Enter your email"
                                        required
                                        maxLength={254}
                                        disabled={saving}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="profilePhone">
                                        Phone Number
                                    </label>

                                    <input
                                        id="profilePhone"
                                        type="tel"
                                        inputMode="numeric"
                                        value={phoneNumber}
                                        onChange={(event) => {
                                            const value =
                                                event.target.value;

                                            if (/^\d{0,10}$/.test(value)) {
                                                setPhoneNumber(value);
                                            }

                                            setValidationError("");
                                            setError("");
                                            setSuccess("");
                                        }}
                                        placeholder="Enter 10-digit phone number"
                                        maxLength={10}
                                        required
                                        disabled={saving}
                                    />
                                </div>

                                {validationError && (
                                    <div
                                        className="student-error"
                                        role="alert"
                                    >
                                        {validationError}
                                    </div>
                                )}

                                <div className="profile-form-actions">
                                    <button
                                        type="submit"
                                        className="save-profile-button"
                                        disabled={saving}
                                    >
                                        {saving
                                            ? "Saving..."
                                            : "Save Changes"}
                                    </button>

                                    <button
                                        type="button"
                                        className="cancel-profile-button"
                                        onClick={handleCancel}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

=======
>>>>>>> JFICT32/CR026
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
<<<<<<< HEAD
                                        : "N/A"}
=======
                                        : "-"}
>>>>>>> JFICT32/CR026
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
<<<<<<< HEAD
=======

            {/* CR-020: Change Password appears below My Profile */}
            <section className="student-password-section">
                <ChangeStudentPassword />
            </section>

>>>>>>> JFICT32/CR026
        </div>
    );
}

export default StudentDashboardPage;
