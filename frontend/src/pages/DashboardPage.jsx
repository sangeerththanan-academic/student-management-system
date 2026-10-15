
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

// Normalize text for case-insensitive search.
const normalizeSearchValue = (value) => {
    return String(value ?? "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
};

// CR033: Format last login timestamp.
const formatLastLogin = (value) => {
    if (!value) {
        return "Never logged in";
    }

    const date =
        value instanceof Date
            ? value
            : new Date(String(value).replace(" ", "T"));

    if (Number.isNaN(date.getTime())) {
        return String(value);
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

    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // Load current user.
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
                    navigate("/login", { replace: true });
                }
            }
        };

        loadUser();
    }, [navigate]);

    // Load students.
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
                navigate("/login", { replace: true });
                return;
            }

            if (error.status === 403) {
                setError(
                    "You do not have permission to access students."
                );
                return;
            }

            setError(
                error.message || "Failed to retrieve students."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    // CR-015: Export student records to CSV.
    const handleExportCSV = () => {
        if (loading || error) {
            return;
        }

        if (students.length === 0) {
            window.alert(
                "No student records available to export."
            );
            return;
        }

        // Required CSV columns.
        const headers = [
            "Student ID",
            "Registration Number",
            "First Name",
            "Last Name",
            "Email",
            "Phone Number"
        ];

        // Escape CSV values and reduce spreadsheet formula injection risk.
        const escapeCSV = (value) => {
            let text = String(value ?? "");

            if (/^[\t\r ]*[=+\-@]/.test(text)) {
                text = "'" + text;
            }

            return `"${text.replace(/"/g, '""')}"`;
        };

        // Use all loaded student records, not only search results.
        const rows = students.map((student) => [
            student.student_id,
            student.registration_no,
            student.first_name,
            student.last_name,
            student.email,
            student.phone_number
        ]);

        const csvContent = [
            headers.map(escapeCSV).join(","),
            ...rows.map((row) =>
                row.map(escapeCSV).join(",")
            )
        ].join("\r\n");

        // UTF-8 BOM supports non-English characters in spreadsheets.
        const blob = new Blob(
            ["\uFEFF", csvContent],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "students.csv";

        document.body.appendChild(link);
        link.click();
        link.remove();

        // Release the temporary URL after the download is initiated.
        window.setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    };

    // Client-side search (CR-001).
    const normalizedSearchTerm =
        normalizeSearchValue(searchTerm);

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

    // Form handling.
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

    // Delete student.
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
            console.error("Delete student error:", error);

            if (error.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }

            setError(
                error.message || "Failed to delete student."
            );
        }
    };

    // Logout.
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
                        type="button"
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
                        <p>
                            Manage student accounts and profiles.
                        </p>
                    </div>

                    <div className="students-heading-actions">

                        {/* CR-015: Export CSV */}
                        <button
                            type="button"
                            className="export-csv-button"
                            onClick={handleExportCSV}
                            disabled={loading || !!error}
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

                {error && (
                    <div className="dashboard-error">
                        {error}
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
                            <p>
                                Add your first student to get started.
                            </p>
                        </div>

                    ) : filteredStudents.length === 0 ? (
                        <div className="students-empty">
                            <h3>No matching students found</h3>

                            <p>
                                No students match &quot;
                                {searchTerm.trim()}&quot;.
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

                                        {/* CR033: Last Login */}
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

                                            {/* CR033: Login timestamp */}
                                            <td>
                                                {formatLastLogin(
                                                    student.last_login
                                                )}
                                            </td>

                                            <td>
                                                <div className="student-actions">

                                                    <button
                                                        type="button"
                                                        className="edit-button"
                                                        onClick={() =>
                                                            openEditForm(student)
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
