// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// import {
//     getStoredUser,
//     logout
// } from "../services/authService";

// import apiRequest from "../services/api";

// import "../styles/studentDashboard.css";

// function StudentDashboardPage() {
//     const navigate = useNavigate();

//     const [user, setUser] = useState(getStoredUser());
//     const [student, setStudent] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState("");

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

//                         <div className="profile-header">
//                             <div className="profile-avatar">
//                                 {student.first_name?.charAt(0)}
//                                 {student.last_name?.charAt(0)}
//                             </div>
//                             <div className="profile-name">
//                                 <h3>
//                                     {student.first_name} {student.last_name}
//                                 </h3>
//                                 <p>{student.registration_no}</p>
//                             </div>
//                         </div>

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
//                                     {student.first_name} {student.last_name}
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
//                                     {new Date(
//                                         student.created_at
//                                     ).toLocaleDateString()}
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

    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        phone_number: ""
    });

    const [formErrors, setFormErrors] = useState({});

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

                    setFormData({
                        email: data.student.email || "",
                        phone_number: data.student.phone_number || ""
                    });
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
        setFormData({
            email: student.email || "",
            phone_number: student.phone_number || ""
        });

        setFormErrors({});
        setError("");
        setSuccess("");
        setEditMode(true);
    };

    const handleCancel = () => {
        setFormData({
            email: student.email || "",
            phone_number: student.phone_number || ""
        });

        setFormErrors({});
        setError("");
        setSuccess("");
        setEditMode(false);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        setFormErrors((previous) => ({
            ...previous,
            [name]: ""
        }));

        setError("");
        setSuccess("");
    };

    const validateForm = () => {
        const errors = {};

        const email = formData.email.trim();
        const phone = formData.phone_number.trim();

        if (!email) {
            errors.email = "Email is required.";
        } else if (
            !/^[A-Z0-9._%+-]+@gmail\.com$/i.test(email)
        ) {
            errors.email = "Please enter a valid Gmail address.";
        }

        if (!phone) {
            errors.phone_number = "Phone number is required.";
        } else if (!/^\d{10}$/.test(phone)) {
            errors.phone_number =
                "Phone number must contain exactly 10 digits.";
        }

        setFormErrors(errors);

        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);

            const updatedData = await apiRequest(
                "/api/students/me",
                {
                    method: "PUT",
                    body: JSON.stringify({
                        email: formData.email.trim(),
                        phone_number: formData.phone_number.trim()
                    })
                }
            );

            if (updatedData.student) {
                setStudent(updatedData.student);

                setFormData({
                    email: updatedData.student.email || "",
                    phone_number:
                        updatedData.student.phone_number || ""
                });
            }

            setEditMode(false);
            setFormErrors({});
            setSuccess(
                updatedData.message || "Profile updated successfully."
            );
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
                                    {student.first_name}{" "}
                                    {student.last_name}
                                </h3>

                                <p>{student.registration_no}</p>
                            </div>
                        </div>

                        {editMode ? (
                            <form
                                className="profile-edit-form"
                                onSubmit={handleSubmit}
                                noValidate
                            >
                                <div className="profile-form-group">
                                    <label htmlFor="profile-email">
                                        Email Address
                                    </label>

                                    <input
                                        id="profile-email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter Gmail address"
                                        autoComplete="email"
                                        required
                                    />

                                    {formErrors.email && (
                                        <p className="profile-field-error">
                                            {formErrors.email}
                                        </p>
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
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        placeholder="Enter 10-digit phone number"
                                        inputMode="numeric"
                                        maxLength={10}
                                        autoComplete="tel"
                                        required
                                    />

                                    {formErrors.phone_number && (
                                        <p className="profile-field-error">
                                            {formErrors.phone_number}
                                        </p>
                                    )}
                                </div>

                                <div className="profile-form-actions">
                                    <button
                                        type="submit"
                                        className="profile-save-button"
                                        disabled={saving}
                                    >
                                        {saving
                                            ? "Saving..."
                                            : "Save Changes"}
                                    </button>

                                    <button
                                        type="button"
                                        className="profile-cancel-button"
                                        onClick={handleCancel}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
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

                                <div className="profile-edit-action">
                                    <button
                                        type="button"
                                        className="profile-edit-button"
                                        onClick={handleEdit}
                                    >
                                        Edit Profile
                                    </button>
                                </div>
                            </>
                        )}

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
