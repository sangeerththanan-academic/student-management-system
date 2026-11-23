// CR006: Student module moved out of the dashboard layout.
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import apiRequest from "../../services/api";
import StudentFormModal from "../../components/StudentFormModal";

const normalizeSearchValue = (value) => String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return "Never logged in";
    const date = new Date(lastLogin);
    return Number.isNaN(date.getTime())
        ? "Never logged in"
        : date.toLocaleString();
};

function StudentsView() {
    const { user, redirectToLogin } = useOutletContext();
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [exportMessage, setExportMessage] = useState("");
    const [exportError, setExportError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    const loadStudents = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await apiRequest("/api/students/", { method: "GET" });
            setStudents(Array.isArray(data.students) ? data.students : []);
        } catch (err) {
            if (err.status === 401) {
                redirectToLogin();
                return;
            }
            setError(
                err.status === 403
                    ? "You do not have permission to access students."
                    : err.message || "Failed to retrieve students."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    const normalizedSearchTerm = normalizeSearchValue(searchTerm);
    const filteredStudents = useMemo(() => {
        if (!normalizedSearchTerm) return students;
        return students.filter((student) => {
            const fullName = `${student.first_name ?? ""} ${student.last_name ?? ""}`;
            return [
                student.registration_no,
                student.first_name,
                student.last_name,
                fullName,
                student.email
            ].some((value) =>
                normalizeSearchValue(value).includes(normalizedSearchTerm)
            );
        });
    }, [students, normalizedSearchTerm]);

    const handleExportCsv = () => {
        setExportMessage("");
        setExportError("");

        try {
            const headers = [
                "Student ID", "Registration Number", "First Name",
                "Last Name", "Email", "Phone Number"
            ];
            const escapeCsvValue = (value) => {
                let text = String(value ?? "");
                if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
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
            const csvContent = "\uFEFF" +
                [headers, ...rows]
                    .map((row) => row.map(escapeCsvValue).join(","))
                    .join("\r\n");
            const url = URL.createObjectURL(
                new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = "students.csv";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            setExportMessage(
                students.length === 0
                    ? "CSV downloaded. No student records were available."
                    : `Successfully exported ${students.length} student records.`
            );
        } catch (err) {
            setExportError(err.message || "Failed to export student records.");
        }
    };

    const handleDelete = async (studentId) => {
        if (!window.confirm("Are you sure you want to delete this student?")) return;

        try {
            setError("");
            await apiRequest(`/api/students/${studentId}`, { method: "DELETE" });
            await loadStudents();
        } catch (err) {
            if (err.status === 401) {
                redirectToLogin();
                return;
            }
            setError(err.message || "Failed to delete student.");
        }
    };

    const isAdmin = String(user?.role ?? "").toUpperCase() === "ADMIN";

    return (
        <>
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
                            onClick={() => {
                                setEditingStudent(null);
                                setShowForm(true);
                            }}
                        >
                            + Add Student
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="dashboard-error" role="alert">{error}</div>}
            {exportMessage && (
                <div className="export-csv-message" role="status">
                    {exportMessage}
                </div>
            )}
            {exportError && (
                <div className="dashboard-error" role="alert">{exportError}</div>
            )}

            <StudentFormModal
                show={showForm}
                editingStudent={editingStudent}
                onClose={() => {
                    setShowForm(false);
                    setEditingStudent(null);
                }}
                onSuccess={loadStudents}
                onAuthError={redirectToLogin}
            />

            <div className="students-search">
                <input
                    type="text"
                    className="students-search-input"
                    placeholder="Search by registration number, name, or email..."
                    aria-label="Search students"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                />
                {searchTerm !== "" && (
                    <button
                        type="button"
                        className="students-search-clear"
                        onClick={() => setSearchTerm("")}
                    >
                        Clear
                    </button>
                )}
            </div>

            {!loading && students.length > 0 && (
                <p className="students-result-count">
                    {normalizedSearchTerm
                        ? `${filteredStudents.length} ${
                            filteredStudents.length === 1 ? "student" : "students"
                        } found`
                        : `${students.length} ${
                            students.length === 1 ? "student" : "students"
                        }`}
                </p>
            )}

            <div className="students-card">
                {loading ? (
                    <div className="students-loading">Loading students...</div>
                ) : students.length === 0 ? (
                    <div className="students-empty">
                        <h3>No students found</h3>
                        <p>Add your first student to get started.</p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="students-empty">
                        <h3>No matching students found</h3>
                        <p>No students match "{searchTerm.trim()}".</p>
                        <button
                            type="button"
                            className="students-search-clear"
                            onClick={() => setSearchTerm("")}
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
                                        <td><strong>{student.registration_no}</strong></td>
                                        <td>{student.first_name} {student.last_name}</td>
                                        <td>{student.email}</td>
                                        <td>{student.phone_number}</td>
                                        <td>{formatLastLogin(student.last_login)}</td>
                                        <td>
                                            {isAdmin && (
                                                <div className="student-actions">
                                                    <button
                                                        type="button"
                                                        className="edit-button"
                                                        onClick={() => {
                                                            setEditingStudent(student);
                                                            setShowForm(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="delete-button"
                                                        onClick={() =>
                                                            handleDelete(student.student_id)
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

export default StudentsView;