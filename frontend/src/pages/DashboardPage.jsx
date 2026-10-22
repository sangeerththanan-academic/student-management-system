import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getStoredUser,
    getCurrentUser,
    logout
} from "../services/authService";

import apiRequest from "../services/api";

import StudentFormModal from "../components/StudentFormModal";
import StudentImportModal from "../components/StudentImportModal";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../context/ThemeContext";
import { triggerCsvDownload, generateStudentsCsv } from "../utils/csvExport";

import "../styles/dashboard.css";

// Normalizes text for case-insensitive search with space handling.
const normalizeSearchValue = (value) => {
    return String(value ?? "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
};


// CR033: Format last_login timestamp into a readable date/time string.
// Returns "Never" for accounts that have not yet logged in (FR-006 fallback).
const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return "Never";
    const date = new Date(lastLogin);
    if (isNaN(date.getTime())) return "Never";
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
};

function DashboardPage() {
    const navigate = useNavigate();
    const { theme } = useTheme("admin");

    const [user, setUser] = useState(getStoredUser());

    const [students, setStudents] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(() => {
        if (typeof window !== "undefined") {
            return new URLSearchParams(window.location.search).get("showAddModal") === "true";
        }
        return false;
    });

    const [editingStudent, setEditingStudent] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState("");
    const [showImportModal, setShowImportModal] = useState(false);
    const [importSuccessMessage, setImportSuccessMessage] = useState("");

    const handleImportSuccess = async (count, message) => {
        await loadStudents();
        setImportSuccessMessage(message || `Successfully imported ${count} student${count === 1 ? "" : "s"}.`);
        setTimeout(() => {
            setImportSuccessMessage("");
        }, 5000);
    };

    // Load current user
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
                    navigate("/login", {
                        replace: true
                    });
                }
            }
        };

        loadUser();
    }, [navigate]);


    // Load students
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
            console.error("Failed to load students:", error);

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


    // Client-side search (CR-001)
    // Filters the already-loaded students only.
    // No API request is made for search keystrokes.
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


    // Form handling
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


    // Delete student
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


    // Logout
    const handleLogout = () => {
        logout();

        navigate(
            "/login",
            {
                replace: true
            }
        );
    };


    // CR-015: Export student records to CSV
    const handleExportCSV = async () => {
        try {
            setExporting(true);
            setExportMessage("");
            setError("");

            const token = localStorage.getItem("token");
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

            let downloaded = false;

            try {
                const response = await fetch(`${apiUrl}/api/students/export/csv`, {
                    method: "GET",
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    }
                });

                if (response.status === 401) {
                    logout();
                    navigate("/login", { replace: true });
                    return;
                }

                if (response.status === 403) {
                    setError("You do not have permission to export student records.");
                    return;
                }

                if (response.ok) {
                    const blob = await response.blob();
                    triggerCsvDownload(blob, "students.csv");
                    downloaded = true;
                }
            } catch (networkErr) {
                console.warn("Backend export request failed, falling back to client-side export:", networkErr);
            }

            // Fallback to client-side CSV generation if backend didn't complete
            if (!downloaded) {
                const csvData = generateStudentsCsv(students);
                triggerCsvDownload(csvData, "students.csv");
            }

            setExportMessage("Student records exported successfully to students.csv.");
            setTimeout(() => {
                setExportMessage("");
            }, 4000);
        } catch (err) {
            console.error("Export students error:", err);
            setError(err.message || "Failed to export student records.");
        } finally {
            setExporting(false);
        }
    };


    // Render
    return (
        <div className={`dashboard-page ${theme}`} data-theme={theme}>

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

                    <ThemeToggle section="admin" showLabel={true} />

                    <button
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
                        <h2>
                            Students
                        </h2>

                        <p>
                            Manage student accounts and profiles.
                        </p>
                    </div>


                    <div className="students-heading-actions">
                        <button
                            type="button"
                            className="export-student-button"
                            id="export-csv-btn"
                            onClick={handleExportCSV}
                            disabled={exporting || loading}
                            aria-label="Export student records to CSV"
                            title="Export student records to CSV"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {exporting ? "Exporting..." : "Export CSV"}
                        </button>

                        {/* CR-022: Import CSV Button near Export CSV */}
                        <button
                            type="button"
                            className="import-student-button"
                            id="import-csv-btn"
                            onClick={() => setShowImportModal(true)}
                            disabled={loading}
                            aria-label="Import student records from CSV"
                            title="Import student records from CSV"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Import CSV
                        </button>

                        <button
                            className="add-student-button"
                            onClick={openAddForm}
                        >
                            + Add Student
                        </button>
                    </div>

                </div>


                {/* Export feedback (CR-015) */}
                {exportMessage && (
                    <div className="dashboard-export-feedback" role="status">
                        <span>{exportMessage}</span>
                        <button
                            type="button"
                            className="feedback-dismiss"
                            onClick={() => setExportMessage("")}
                            aria-label="Dismiss message"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {/* Import feedback (CR-022) */}
                {importSuccessMessage && (
                    <div className="dashboard-export-feedback dashboard-import-feedback" role="status">
                        <span>{importSuccessMessage}</span>
                        <button
                            type="button"
                            className="feedback-dismiss"
                            onClick={() => setImportSuccessMessage("")}
                            aria-label="Dismiss message"
                        >
                            &times;
                        </button>
                    </div>
                )}


                {/* Error */}

                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}


                {/* Student form modal */}

                <StudentFormModal
                    show={showForm}
                    editingStudent={editingStudent}
                    onClose={handleFormClose}
                    onSuccess={loadStudents}
                    onAuthError={handleFormAuthError}
                />

                {/* Student import modal (CR-022) */}
                <StudentImportModal
                    show={showImportModal}
                    existingStudents={students}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={handleImportSuccess}
                    onAuthError={handleFormAuthError}
                />


                {/* Students */}

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
                            <h3>
                                No students found
                            </h3>

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
                                        {/* CR-010: Profile Image Column */}
                                        <th>
                                            Image
                                        </th>

                                        <th>
                                            Registration No.
                                        </th>

                                        <th>
                                            Name
                                        </th>

                                        <th>
                                            Email
                                        </th>

                                        <th>
                                            Phone
                                        </th>

                                        {/* CR033: Last Login column (FR-005) */}
                                        <th>
                                            Last Login
                                        </th>

                                        <th>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>


                                <tbody>

                                    {filteredStudents.map((student) => (
                                        <tr
                                            key={student.student_id}
                                        >

                                            {/* CR-010: Profile Image / Placeholder */}
                                            <td className="student-photo-cell">
                                                {student.profile_photo ? (
                                                    <img
                                                        src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${student.profile_photo}`}
                                                        alt={`${student.first_name} ${student.last_name}`}
                                                        className="student-table-photo"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = "none";
                                                            const fallback = e.currentTarget.parentElement?.querySelector(".student-table-photo-placeholder");
                                                            if (fallback) fallback.style.display = "flex";
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className="student-table-photo-placeholder"
                                                    style={{ display: student.profile_photo ? "none" : "flex" }}
                                                    title={`${student.first_name} ${student.last_name}`}
                                                >
                                                    <span>
                                                        {(student.first_name?.charAt(0) || "S").toUpperCase()}
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

                                            {/* CR033: Display formatted last login timestamp */}
                                            <td className={!student.last_login ? "last-login-never" : ""}>
                                                {formatLastLogin(student.last_login)}
                                            </td>

                                            <td>

                                                <div className="student-actions">

                                                    <button
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
