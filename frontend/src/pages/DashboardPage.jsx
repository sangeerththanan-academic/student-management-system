import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getStoredUser,
    getCurrentUser,
    logout
} from "../services/authService";

import apiRequest from "../services/api";
import StudentFormModal from "../components/StudentFormModal";
import "../styles/dashboard.css";

const normalizeSearchValue = (value) => {
    return String(value ?? "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
};

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

// Escape CSV values, including commas, quotation marks and line breaks.
const escapeCSVValue = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
};

// Generate and download the CSV file.
function exportStudentsToCSV(students) {
    const headers = [
        "Student ID",
        "Registration Number",
        "First Name",
        "Last Name",
        "Email",
        "Phone Number"
    ];

    const rows = students.map((student) => [
        student.student_id,
        student.registration_no,
        student.first_name,
        student.last_name,
        student.email,
        student.phone_number
    ]);

    const csvContent = [
        headers.map(escapeCSVValue).join(","),
        ...rows.map((row) => row.map(escapeCSVValue).join(","))
    ].join("\r\n");

    // BOM helps spreadsheet applications display UTF-8 correctly.
    const blob = new Blob(["\uFEFF", csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "students.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

function StudentAvatar({ student }) {
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setImageFailed(false);
    }, [student.profile_photo]);

    const imageUrl = student.profile_photo
        ? `${API_BASE_URL}${student.profile_photo}`
        : "";

    const initials = `${student.first_name?.trim()?.charAt(0) || ""}${student.last_name?.trim()?.charAt(0) || ""}`.toUpperCase();

    if (imageUrl && !imageFailed) {
        return (
            <img
                src={imageUrl}
                alt={`${student.first_name} ${student.last_name} profile`}
                className="student-profile-avatar"
                onError={() => setImageFailed(true)}
            />
        );
    }

    return (
        <div
            className="student-profile-placeholder"
            role="img"
            aria-label={`${student.first_name} ${student.last_name} initials`}
        >
            {initials || "S"}
        </div>
    );
}

// Format the last successful login timestamp.
function formatLastLogin(lastLogin) {
    if (!lastLogin) {
        return "Never logged in";
    }

    const date = new Date(lastLogin);

    if (Number.isNaN(date.getTime())) {
        return "Never logged in";
    }

    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

function DashboardPage() {
    const navigate = useNavigate();

    const [user, setUser] = useState(getStoredUser());
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [exportMessage, setExportMessage] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

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
                console.error("Failed to load current user:", error);

                if (error.status === 401) {
                    logout();
                    navigate("/login", { replace: true });
                }
            }
        };

        loadUser();
    }, [navigate]);

    const loadStudents = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await apiRequest("/api/students/", {
                method: "GET"
            });

            setStudents(data.students || []);
        } catch (error) {
            console.error("Failed to load students:", error);

            if (error.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }

            if (error.status === 403) {
                setError("You do not have permission to access students.");
                return;
            }

            setError(error.message || "Failed to retrieve students.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    const normalizedSearchTerm = normalizeSearchValue(searchTerm);
    const isSearching = normalizedSearchTerm !== "";

    const filteredStudents = useMemo(() => {
        if (!isSearching) return students;

        return students.filter((student) => {
            const registrationNo = normalizeSearchValue(student.registration_no);
            const firstName = normalizeSearchValue(student.first_name);
            const lastName = normalizeSearchValue(student.last_name);
            const fullName = normalizeSearchValue(
                `${student.first_name ?? ""} ${student.last_name ?? ""}`
            );
            const email = normalizeSearchValue(student.email);

            return (
                registrationNo.includes(normalizedSearchTerm) ||
                firstName.includes(normalizedSearchTerm) ||
                lastName.includes(normalizedSearchTerm) ||
                fullName.includes(normalizedSearchTerm) ||
                email.includes(normalizedSearchTerm)
            );
        });
    }, [students, normalizedSearchTerm, isSearching]);

    const handleClearSearch = () => setSearchTerm("");

    const handleExportCSV = () => {
        setExportMessage("");

        if (loading) {
            setExportMessage("Please wait until student records finish loading.");
            return;
        }

        if (error) {
            setExportMessage("Students could not be loaded. Please try again.");
            return;
        }

        try {
            exportStudentsToCSV(students);

            setExportMessage(
                students.length === 0
                    ? "An empty students.csv file has been downloaded."
                    : `Successfully exported ${students.length} student record(s).`
            );
        } catch (exportError) {
            console.error("CSV export failed:", exportError);
            setExportMessage("Failed to export students. Please try again.");
        }
    };

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
        navigate("/login", { replace: true });
    };

    const handleDelete = async (studentId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this student?"
        );

        if (!confirmed) return;

        try {
            setError("");

            await apiRequest(`/api/students/${studentId}`, {
                method: "DELETE"
            });

            await loadStudents();
        } catch (error) {
            console.error("Delete student error:", error);

            if (error.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }

            setError(error.message || "Failed to delete student.");
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <div>
                    <h1>Student Management System</h1>
                    <p>Administrator Dashboard</p>
                </div>

                <div className="dashboard-header-actions">
                    <div className="admin-info">
                        <strong>{user?.username}</strong>
                        <span>{user?.role}</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="logout-button"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="students-heading">
                    <div>
                        <h2>Students</h2>
                        <p>Manage student accounts and profiles.</p>
                    </div>

                    <div className="students-heading-actions">
                        <button
                            type="button"
                            className="export-csv-button"
                            onClick={handleExportCSV}
                            disabled={loading}
                        >
                            Export CSV
                        </button>

                        <button
                            className="add-student-button"
                            onClick={openAddForm}
                        >
                            + Add Student
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="dashboard-error">{error}</div>
                )}

                {exportMessage && (
                    <div
                        className="students-result-count"
                        role="status"
                        aria-live="polite"
                    >
                        {exportMessage}
                    </div>
                )}

                <StudentFormModal
                    show={showForm}
                    editingStudent={editingStudent}
                    onClose={handleFormClose}
                    onSuccess={loadStudents}
                    onAuthError={handleFormAuthError}
                />

                <div className="students-search">
                    <input
                        type="text"
                        className="students-search-input"
                        placeholder="Search by registration number, name, or email..."
                        aria-label="Search students by registration number, name, or email"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
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

                {!loading && students.length > 0 && (
                    <p className="students-result-count">
                        {isSearching
                            ? `${filteredStudents.length} ${filteredStudents.length === 1 ? "student" : "students"} found`
                            : `${students.length} ${students.length === 1 ? "student" : "students"}`}
                    </p>
                )}

                <div className="students-card">
                    {loading ? (
                        <div className="students-loading">
                            Loading students...
                        </div>
                    ) : students.length === 0 ? (
                        <div className="students-empty">
                            <h3>No students found</h3>
                            <p>Add your first student to get started.</p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="students-empty">
                            <h3>No matching students found</h3>
                            <p>
                                No students match &quot;{searchTerm.trim()}&quot;.
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
                                        <th>Last Login</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredStudents.map((student) => (
                                        <tr key={student.student_id}>
                                            <td>
                                                <StudentAvatar student={student} />
                                            </td>

                                            <td>
                                                <strong>{student.registration_no}</strong>
                                            </td>

                                            <td>
                                                {student.first_name} {student.last_name}
                                            </td>

                                            <td>{student.email}</td>
                                            <td>{student.phone_number}</td>

                                            <td>
                                                <span title={student.last_login || ""}>
                                                    {formatLastLogin(student.last_login)}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="student-actions">
                                                    <button
                                                        className="edit-button"
                                                        onClick={() => openEditForm(student)}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="delete-button"
                                                        onClick={() => handleDelete(student.student_id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
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
