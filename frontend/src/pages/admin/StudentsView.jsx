import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { logout } from "../../services/authService";
import apiRequest from "../../services/api";
import StudentFormModal from "../../components/StudentFormModal";

// Normalizes text for case-insensitive search with space handling (CR-001)
const normalizeSearchValue = (value) => {
    return String(value ?? "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
};

function StudentsView() {
    const navigate = useNavigate();

    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // Load students
    const loadStudents = useCallback(() => {
        return apiRequest("/api/students/", {
            method: "GET"
        })
            .then((data) => {
                setStudents(data.students || []);
                setError("");
            })
            .catch((err) => {
                console.error("Failed to load students:", err);

                if (err.status === 401) {
                    logout();
                    navigate("/login", { replace: true });
                    return;
                }

                if (err.status === 403) {
                    setError("You do not have permission to access students.");
                    return;
                }

                setError(err.message || "Failed to retrieve students.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [navigate]);

    useEffect(() => {
        let active = true;
        apiRequest("/api/students/", {
            method: "GET"
        })
            .then((data) => {
                if (active) {
                    setStudents(data.students || []);
                    setError("");
                }
            })
            .catch((err) => {
                if (!active) return;
                console.error("Failed to load students:", err);

                if (err.status === 401) {
                    logout();
                    navigate("/login", { replace: true });
                    return;
                }

                if (err.status === 403) {
                    setError("You do not have permission to access students.");
                    return;
                }

                setError(err.message || "Failed to retrieve students.");
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [navigate]);

    // Client-side search (CR-001)
    const normalizedSearchTerm = normalizeSearchValue(searchTerm);
    const isSearching = normalizedSearchTerm !== "";

    const filteredStudents = useMemo(() => {
        if (!isSearching) {
            return students;
        }

        return students.filter((student) => {
            const registrationNo = normalizeSearchValue(student.registration_no);
            const firstName = normalizeSearchValue(student.first_name);
            const lastName = normalizeSearchValue(student.last_name);
            const fullName = normalizeSearchValue(`${student.first_name ?? ""} ${student.last_name ?? ""}`);
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
            await apiRequest(`/api/students/${studentId}`, {
                method: "DELETE"
            });

            setError("");
            await loadStudents();

        } catch (err) {
            console.error("Delete student error:", err);

            if (err.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }

            setError(err.message || "Failed to delete student.");
        }
    };

    return (
        <div className="students-view-container">
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

            {/* Search */}
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
                        <p>No students match &quot;{searchTerm.trim()}&quot;.</p>
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
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredStudents.map((student) => (
                                    <tr key={student.student_id}>
                                        <td>
                                            <strong>{student.registration_no}</strong>
                                        </td>
                                        <td>
                                            {student.first_name} {student.last_name}
                                        </td>
                                        <td>{student.email}</td>
                                        <td>{student.phone_number}</td>
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
        </div>
    );
}

export default StudentsView;
