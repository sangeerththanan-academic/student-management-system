
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

// Normalizes text for case-insensitive search.
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
                    navigate("/login", { replace: true });
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
                setError(
                    "You do not have permission to access students."
                );
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

    // Client-side search (CR-001)
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

    // Logout
    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    // CR-010: Student profile image with initials fallback
    const getStudentInitials = (student) => {
        const firstInitial = student.first_name?.trim()?.charAt(0) || "";
        const lastInitial = student.last_name?.trim()?.charAt(0) || "";

        return `${firstInitial}${lastInitial}`.toUpperCase() || "?";
    };

    const getProfileImageUrl = (profilePhoto) => {
        if (!profilePhoto) {
            return "";
        }

        // Support absolute URLs and backend-relative upload paths.
        if (/^https?:\/\//i.test(profilePhoto)) {
            return profilePhoto;
        }

        return `${API_BASE_URL}${profilePhoto.startsWith("/") ? "" : "/"}${profilePhoto}`;
    };

    // Render
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
                {/* Page heading */}
                <div className="students-heading">
                    <div>
                        <h2>Students</h2>
                        <p>Manage student accounts and profiles.</p>
                    </div>

                    <button
                        className="add-student-button"
                        onClick={openAddForm}
                    >
                        + Add Student
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="dashboard-error" role="alert">
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

                {/* Student search */}
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
                                        <th>Profile Image</th>
                                        <th>Registration No.</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredStudents.map((student) => (
                                        <tr key={student.student_id}>
                                            {/* CR-010: Profile Image */}
                                            <td>
                                                <div className="student-profile-cell">
                                                    {student.profile_photo ? (
                                                        <img
                                                            src={getProfileImageUrl(
                                                                student.profile_photo
                                                            )}
                                                            alt={`${student.first_name} ${student.last_name}`}
                                                            className="student-list-photo"
                                                            onError={(event) => {
                                                                event.currentTarget.style.display =
                                                                    "none";

                                                                const fallback =
                                                                    event.currentTarget
                                                                        .nextElementSibling;

                                                                if (fallback) {
                                                                    fallback.style.display =
                                                                        "flex";
                                                                }
                                                            }}
                                                        />
                                                    ) : null}

                                                    <div
                                                        className="student-list-photo-placeholder"
                                                        style={{
                                                            display: student.profile_photo
                                                                ? "none"
                                                                : "flex"
                                                        }}
                                                        aria-label="Student initials placeholder"
                                                    >
                                                        {getStudentInitials(student)}
                                                    </div>
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

                                            <td>{student.email}</td>

                                            <td>{student.phone_number}</td>

                                            <td>
                                                <div className="student-actions">
                                                    <button
                                                        className="edit-button"
                                                        onClick={() =>
                                                            openEditForm(student)
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
