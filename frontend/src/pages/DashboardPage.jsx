import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getStoredUser,
    getCurrentUser,
    logout
} from "../services/authService";

import apiRequest from "../services/api";

import StudentFormModal from "../components/StudentFormModal";
import ThemeToggle from "../components/ThemeToggle";

import "../styles/dashboard.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const formatLastLoginValue = (value) => {
    if (!value) {
        return "Never";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Never";
    }

    const day = String(date.getUTCDate()).padStart(2, "0");
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = monthNames[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

// Normalizes text for case-insensitive search with space handling.
const normalizeSearchValue = (value) => {
    return String(value ?? "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
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

    function csvExport(students, filename = "students.csv") {
        const headers = ["Student ID", "Registration Number", "First Name", "Last Name", "Email", "Phone Number"];

        // 2. Map student objects to CSV rows
        const rows = students.map(student => [
            student.student_id ?? "",
            // Wrap fields in quotes to handle commas or special characters safely
            `"${(student.registration_no || "").replace(/"/g, '""')}"`,
            `"${(student.first_name || "").replace(/"/g, '""')}"`,
            `"${(student.last_name || "").replace(/"/g, '""')}"`,
            `"${(student.email || "").replace(/"/g, '""')}"`,
            `"${(student.phone_number || "").replace(/"/g, '""')}"`
        ]);

        // 3. Combine headers and rows into a single CSV string
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        // 4. Create a Blob and trigger a download link in the browser
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);

        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

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


    // Render
    return (
        <div className="dashboard-page">

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

                    <ThemeToggle />

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


                    <div>
                        <button className="export-csv-button" onClick={() => csvExport(students)}> Export CSV </button>
                        <button className="add-student-button" onClick={openAddForm}> + Add Student </button>
                    </div>

                </div>


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

                                            <td>
                                                <strong>
                                                    {student.registration_no}
                                                </strong>
                                            </td>

                                            <td>
                                                <div className="student-list-name">
                                                    {student.profile_img_url ? (
                                                        <img
                                                            className="student-list-avatar"
                                                            src={new URL(student.profile_img_url, API_BASE_URL).toString()}
                                                            alt={`${student.first_name} ${student.last_name}`}
                                                        />
                                                    ) : (
                                                        <span className="student-list-avatar student-list-avatar-fallback" aria-hidden="true">
                                                            {student.first_name?.charAt(0)}
                                                            {student.last_name?.charAt(0)}
                                                        </span>
                                                    )}
                                                    <span>
                                                        {student.first_name}{" "}
                                                        {student.last_name}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                {student.email}
                                            </td>

                                            <td>
                                                {student.phone_number}
                                            </td>

                                            <td>
                                                {formatLastLoginValue(student.last_login_at)}
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
