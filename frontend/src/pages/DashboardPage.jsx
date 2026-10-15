
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import ThemeToggle from "../components/ThemeToggle";

import {
    getStoredUser,
    getCurrentUser,
    logout
} from "../services/authService";

import apiRequest from "../services/api";
import StudentFormModal from "../components/StudentFormModal";

import "../styles/dashboard.css";

// Normalize text for searching
const normalizeSearchValue = (value) => {
    return String(value ?? "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
};

// Format last login timestamp
const formatLastLogin = (lastLogin) => {
    if (!lastLogin) {
        return "Never logged in";
    }

    const date = new Date(lastLogin);

    if (Number.isNaN(date.getTime())) {
        return "Never logged in";
    }

    return date.toLocaleString();
};

function DashboardPage() {
    const navigate = useNavigate();

    const [user, setUser] = useState(getStoredUser());
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [exportMessage, setExportMessage] = useState("");
    const [exportError, setExportError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // Logout and redirect to login
    const redirectToLogin = () => {
        logout();
        navigate("/login", { replace: true });
    };

    // Load current logged-in user
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
            } catch (err) {
                console.error("Failed to load current user:", err);

                if (err.status === 401) {
                    redirectToLogin();
                }
            }
        };

        loadUser();
    }, []);

    // Load students from the protected API
    const loadStudents = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await apiRequest("/api/students/", {
                method: "GET"
            });

            setStudents(
                Array.isArray(data.students) ? data.students : []
            );
        } catch (err) {
            console.error("Failed to load students:", err);

            if (err.status === 401) {
                redirectToLogin();
                return;
            }

            if (err.status === 403) {
                setError(
                    "You do not have permission to access students."
                );
                return;
            }

            setError(err.message || "Failed to retrieve students.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    // Client-side student search
    const normalizedSearchTerm = normalizeSearchValue(searchTerm);
    const isSearching = normalizedSearchTerm !== "";

    const filteredStudents = useMemo(() => {
        if (!isSearching) {
            return students;
        }

        return students.filter((student) => {
            const registrationNo = normalizeSearchValue(
                student.registration_no
            );

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

    const handleClearSearch = () => {
        setSearchTerm("");
    };

    // CR-015: Export all available student records as CSV
    const handleExportCsv = () => {
        setExportMessage("");
        setExportError("");

        try {
            if (!Array.isArray(students)) {
                throw new Error("Student records are not available.");
            }

            const headers = [
                "Student ID",
                "Registration Number",
                "First Name",
                "Last Name",
                "Email",
                "Phone Number"
            ];

            // Escape values containing commas, quotes or newlines
            const escapeCsvValue = (value) => {
                let text = String(value ?? "");

                // Prevent spreadsheet formula execution for untrusted values
                if (/^[\s]*[=+\-@]/.test(text)) {
                    text = "'" + text;
                }

                return `"${text.replace(/"/g, '""')}"`;
            };

            const rows = students.map((student) => [
                student.student_id,
                student.registration_no,
                student.first_name,
                student.last_name,
                student.email,
                student.phone_number
            ]);

            const csvContent =
                "\uFEFF" +
                [headers, ...rows]
                    .map((row) => row.map(escapeCsvValue).join(","))
                    .join("\r\n");

            const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;"
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = "students.csv";

            document.body.appendChild(link);
            link.click();
            link.remove();

            // Release the generated file URL after the browser handles the click
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);

            setExportMessage(
                students.length === 0
                    ? "CSV downloaded. No student records were available."
                    : `Successfully exported ${students.length} student records.`
            );
        } catch (err) {
            console.error("CSV export error:", err);
            setExportError(
                err.message || "Failed to export student records."
            );
        }
    };

    // Open form to add a student
    const openAddForm = () => {
        setEditingStudent(null);
        setShowForm(true);
    };

    // Open form to edit a student
    const openEditForm = (student) => {
        setEditingStudent(student);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingStudent(null);
    };

    const handleFormAuthError = () => {
        redirectToLogin();
    };

    // Delete a student
    const handleDelete = async (studentId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this student?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await apiRequest(`/api/students/${studentId}`, {
                method: "DELETE"
            });

            await loadStudents();
        } catch (err) {
            console.error("Delete student error:", err);

            if (err.status === 401) {
                redirectToLogin();
                return;
            }

            if (err.status === 403) {
                setError(
                    "You do not have permission to delete this student."
                );
                return;
            }

            setError(err.message || "Failed to delete student.");
        }
    };

    // Logout
    const handleLogout = () => {
        redirectToLogin();
    };

    const isAdmin =
        String(user?.role ?? "").toUpperCase() === "ADMIN";

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
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="logout-button"
                    >
                        Logout
                    </button>

                    <ThemeToggle />
                </div>
            </header>

            <main className="dashboard-content">
                <div className="students-heading">
                    <div>
                        <h2>Students</h2>
                        <p>Manage student accounts and profiles.</p>
                    </div>

                    <div className="students-heading-actions">
                        {isAdmin && (
                            <button
                                type="button"
                                className="export-csv-button"
                                onClick={handleExportCsv}
                                disabled={loading}
                            >
                                Export CSV
                            </button>
                        )}

                        {isAdmin && (
                            <button
                                type="button"
                                className="add-student-button"
                                onClick={openAddForm}
                            >
                                + Add Student
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="dashboard-error" role="alert">
                        {error}
                    </div>
                )}

                {exportMessage && (
                    <div
                        className="export-csv-message"
                        role="status"
                        aria-live="polite"
                    >
                        {exportMessage}
                    </div>
                )}

                {exportError && (
                    <div
                        className="dashboard-error"
                        role="alert"
                    >
                        {exportError}
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
                                No students match "{searchTerm.trim()}".
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
                                                <strong>
                                                    {student.registration_no}
                                                </strong>
                                            </td>

                                            <td>
                                                {student.first_name}{" "}
                                                {student.last_name}
                                            </td>

                                            <td>{student.email}</td>
                                            <td>{student.phone_number}</td>

                                            <td>
                                                {formatLastLogin(
                                                    student.last_login
                                                )}
                                            </td>

                                            <td>
                                                <div className="student-actions">
                                                    {isAdmin && (
                                                        <>
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
                                                        </>
                                                    )}
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
