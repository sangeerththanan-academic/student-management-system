import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getStoredUser,
    getCurrentUser,
    logout
} from "../services/authService";

import apiRequest, { API_BASE_URL } from "../services/api";

import StudentFormModal from "../components/StudentFormModal";

import "../styles/dashboard.css";

// ============================================================
// CR-001: Normalize values for client-side search
// ============================================================

const normalizeSearchValue = (value) => {
    return String(value ?? "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
};

// ============================================================
// CR-010: Build profile image URL
// ============================================================

const getProfilePhotoUrl = (profilePhoto) => {
    if (!profilePhoto) {
        return "";
    }

    if (/^https?:\/\//i.test(profilePhoto)) {
        return profilePhoto;
    }

    const baseUrl = API_BASE_URL.replace(/\/+$/, "");
    const imagePath = String(profilePhoto).replace(/^\/+/, "");

    return `${baseUrl}/${imagePath}`;
};

// ============================================================
// CR-010: Generate student initials
// ============================================================

const getStudentInitials = (student) => {
    const firstInitial = String(student.first_name ?? "")
        .trim()
        .charAt(0);

    const lastInitial = String(student.last_name ?? "")
        .trim()
        .charAt(0);

    return `${firstInitial}${lastInitial}`.toUpperCase() || "?";
};

// ============================================================
// CR-033: Format last login date and time
// ============================================================

const formatLastLogin = (lastLogin) => {
    if (
        lastLogin === null ||
        lastLogin === undefined ||
        lastLogin === ""
    ) {
        return "Never logged in";
    }

    // MySQL DATETIME usually returns "YYYY-MM-DD HH:mm:ss".
    // Convert the separator to ISO-style local datetime parsing.
    const dateValue =
        typeof lastLogin === "string"
            ? lastLogin.replace(
                /^(\d{4}-\d{2}-\d{2})\s/,
                "$1T"
            )
            : lastLogin;

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Unavailable";
    }

    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    }).format(date);
};

// ============================================================
// ADMIN DASHBOARD
// ============================================================

function DashboardPage() {
    const navigate = useNavigate();

    const [user, setUser] = useState(getStoredUser());
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // ========================================================
    // Load current user
    // ========================================================

    useEffect(() => {
        const loadUser = async () => {
            try {
                const data = await getCurrentUser();

                if (data.user) {
                    setUser({
                        id: data.user.user_id,
                        username: data.user.username,
                        role: data.user.role
                    });
                }
            } catch (error) {
                console.error(
                    "Failed to load current user:",
                    error
                );

                if (error.status === 401) {
                    logout();

                    navigate("/login", {
                        replace: true
                    });
                }
            }
        };

        loadUser();
    }, [navigate]);

    // ========================================================
    // Load students
    // CR-033: API response includes last_login
    // ========================================================

    const loadStudents = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await apiRequest(
                "/api/students/",
                {
                    method: "GET"
                }
            );

            setStudents(data.students || []);
        } catch (error) {
            console.error(
                "Failed to load students:",
                error
            );

            if (error.status === 401) {
                logout();

                navigate("/login", {
                    replace: true
                });

                return;
            }

            if (error.status === 403) {
                setError(
                    "You do not have permission to access students."
                );

                return;
            }

            setError(
                error.message ||
                "Failed to retrieve students."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    // ========================================================
    // CR-001: Client-side student search
    // ========================================================

    const normalizedSearchTerm =
        normalizeSearchValue(searchTerm);

    const isSearching =
        normalizedSearchTerm !== "";

    const filteredStudents = useMemo(() => {
        if (!isSearching) {
            return students;
        }

        return students.filter((student) => {
            const registrationNo = normalizeSearchValue(
                student.registration_no
            );

            const firstName = normalizeSearchValue(
                student.first_name
            );

            const lastName = normalizeSearchValue(
                student.last_name
            );

            const fullName = normalizeSearchValue(
                `${student.first_name ?? ""} ${student.last_name ?? ""}`
            );

            const email = normalizeSearchValue(
                student.email
            );

            return (
                registrationNo.includes(normalizedSearchTerm) ||
                firstName.includes(normalizedSearchTerm) ||
                lastName.includes(normalizedSearchTerm) ||
                fullName.includes(normalizedSearchTerm) ||
                email.includes(normalizedSearchTerm)
            );
        });
    }, [students, normalizedSearchTerm, isSearching]);

    const handleClearSearch = () => {
        setSearchTerm("");
    };

    // ========================================================
    // CR-015: Export student records to CSV
    // Exports the complete student list, not only search results.
    // ========================================================

    const handleExportCsv = () => {
        if (!students.length) {
            setError("There are no student records to export.");
            return;
        }

        const csvColumns = [
            { heading: "Registration No.", value: (student) => student.registration_no },
            { heading: "First Name", value: (student) => student.first_name },
            { heading: "Last Name", value: (student) => student.last_name },
            { heading: "Email", value: (student) => student.email },
            { heading: "Phone", value: (student) => student.phone_number },
            {
                heading: "Last Login",
                value: (student) => {
                    if (!student.last_login) return "Never logged in";
                    return student.last_login;
                }
            },
            { heading: "Created At", value: (student) => student.created_at },
            { heading: "Updated At", value: (student) => student.updated_at }
        ];

        // Escape quotes and wrap every field in quotes so commas,
        // quotes, and line breaks in values do not break the CSV format.
        const escapeCsvValue = (value) => {
            const safeValue = value === null || value === undefined
                ? ""
                : String(value);

            return `"${safeValue.replace(/"/g, '""')}"`;
        };

        const csvRows = [
            csvColumns.map((column) => escapeCsvValue(column.heading)).join(","),
            ...students.map((student) =>
                csvColumns
                    .map((column) => escapeCsvValue(column.value(student)))
                    .join(",")
            )
        ];

        // UTF-8 BOM improves compatibility with Excel for Unicode text.
        const csvContent = "\uFEFF" + csvRows.join("\r\n");
        const csvBlob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;"
        });

        const downloadUrl = URL.createObjectURL(csvBlob);
        const downloadLink = document.createElement("a");
        const dateStamp = new Date().toISOString().slice(0, 10);

        downloadLink.href = downloadUrl;
        downloadLink.download = `student_records_${dateStamp}.csv`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        URL.revokeObjectURL(downloadUrl);
        setError("");
    };

    // ========================================================
    // Student form handling
    // ========================================================

    const openAddForm = () => {
        setEditingStudent(null);
        setShowForm(true);
    };

    const openEditForm = (student) => {
        setEditingStudent(student);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingStudent(null);
    };

    const handleFormAuthError = () => {
        logout();

        navigate("/login", {
            replace: true
        });
    };

    // ========================================================
    // Delete student
    // ========================================================

    const handleDelete = async (studentId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this student?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await apiRequest(
                `/api/students/${studentId}`,
                {
                    method: "DELETE"
                }
            );

            await loadStudents();
        } catch (error) {
            console.error(
                "Delete student error:",
                error
            );

            if (error.status === 401) {
                logout();

                navigate("/login", {
                    replace: true
                });

                return;
            }

            setError(
                error.message ||
                "Failed to delete student."
            );
        }
    };

    // ========================================================
    // Logout
    // ========================================================

    const handleLogout = () => {
        logout();

        navigate("/login", {
            replace: true
        });
    };

    // ========================================================
    // Render dashboard
    // ========================================================

    return (
        <div className="dashboard-page">

            {/* Dashboard header */}

            <header className="dashboard-header">
                <div>
                    <h1>
                        Student Management System
                    </h1>

                    <p>
                        Administrator Dashboard
                    </p>
                </div>

                <div className="dashboard-header-actions">
                    <div className="admin-info">
                        <strong>
                            {user?.username}
                        </strong>

                        <span>
                            {user?.role}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="logout-button"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-content">

                {/* Page heading */}

                <div className="students-heading">
                    <div>
                        <h2>Students</h2>

                        <p>
                            Manage student accounts and profiles.
                        </p>
                    </div>

                    <div className="students-heading-actions">
                        <button
                            type="button"
                            className="export-csv-button"
                            onClick={handleExportCsv}
                            disabled={loading || students.length === 0}
                        >
                            Export CSV
                        </button>

                        <button
                            type="button"
                            className="add-student-button"
                            onClick={openAddForm}
                        >
                            + Add Student
                        </button>
                    </div>
                </div>

                {/* Error message */}

                {error && (
                    <div
                        className="dashboard-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {/* Add/Edit student modal */}

                <StudentFormModal
                    show={showForm}
                    editingStudent={editingStudent}
                    onClose={handleFormClose}
                    onSuccess={loadStudents}
                    onAuthError={handleFormAuthError}
                />

                {/* Student search: CR-001 */}

                <div className="students-search">
                    <input
                        type="text"
                        className="students-search-input"
                        placeholder="Search by registration number, name, or email..."
                        aria-label="Search students by registration number, name, or email"
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(event.target.value)
                        }
                    />

                    {searchTerm !== "" && (
                        <button
                            type="button"
                            className="students-search-clear"
                            onClick={handleClearSearch}
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Search result count */}

                {!loading && students.length > 0 && (
                    <p className="students-result-count">
                        {isSearching
                            ? `${filteredStudents.length} ${
                                filteredStudents.length === 1
                                    ? "student"
                                    : "students"
                            } found`
                            : `${students.length} ${
                                students.length === 1
                                    ? "student"
                                    : "students"
                            }`}
                    </p>
                )}

                {/* Student table */}

                <div className="students-card">
                    {loading ? (
                        <div className="students-loading">
                            Loading students...
                        </div>
                    ) : students.length === 0 ? (
                        <div className="students-empty">
                            <h3>No students found</h3>

                            <p>
                                Add your first student to get started.
                            </p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="students-empty">
                            <h3>
                                No matching students found
                            </h3>

                            <p>
                                No students match &quot;
                                {searchTerm.trim()}
                                &quot;.
                            </p>

                            <button
                                type="button"
                                className="students-search-clear"
                                onClick={handleClearSearch}
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        <div className="students-table-wrapper">
                            <table className="students-table">

                                <thead>
                                    <tr>
                                        <th>Profile</th>
                                        <th>Registration No.</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>

                                        {/* CR-033 */}
                                        <th>Last Login</th>

                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredStudents.map((student) => {
                                        const photoUrl =
                                            getProfilePhotoUrl(
                                                student.profile_photo
                                            );

                                        return (
                                            <tr
                                                key={student.student_id}
                                            >
                                                {/* CR-010: Profile photo */}

                                                <td>
                                                    <div
                                                        className="student-profile-cell"
                                                        title={`${student.first_name ?? ""} ${student.last_name ?? ""}`}
                                                    >
                                                        {photoUrl && (
                                                            <img
                                                                className="student-profile-image"
                                                                src={photoUrl}
                                                                alt={`${student.first_name ?? "Student"} ${student.last_name ?? ""} profile`}
                                                                loading="lazy"
                                                                onError={(event) => {
                                                                    event.currentTarget.style.display =
                                                                        "none";
                                                                }}
                                                            />
                                                        )}

                                                        <span className="student-profile-placeholder">
                                                            {getStudentInitials(
                                                                student
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    <strong>
                                                        {student.registration_no}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {student.first_name}{" "}
                                                    {student.last_name}
                                                </td>

                                                <td>
                                                    {student.email}
                                                </td>

                                                <td>
                                                    {student.phone_number}
                                                </td>

                                                {/* CR-033: Last Login */}

                                                <td className="student-last-login">
                                                    {formatLastLogin(
                                                        student.last_login
                                                    )}
                                                </td>

                                                {/* Existing CRUD actions */}

                                                <td>
                                                    <div className="student-actions">
                                                        <button
                                                            type="button"
                                                            className="edit-button"
                                                            onClick={() =>
                                                                openEditForm(
                                                                    student
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="delete-button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    student.student_id
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>

                            </table>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}

export default DashboardPage;
