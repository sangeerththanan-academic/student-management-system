import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import apiRequest, { API_BASE_URL } from "../../services/api";
import { logout } from "../../services/authService";
import StudentFormModal from "../../components/StudentFormModal";

const normalize = (value) => String(value ?? "").toLowerCase().trim().replace(/\s+/g, " ");

function getPhotoUrl(profilePhoto) {
    if (!profilePhoto) return "";
    if (/^https?:\/\//i.test(profilePhoto)) return profilePhoto;
    return `${API_BASE_URL.replace(/\/+$/, "")}/${String(profilePhoto).replace(/^\/+/, "")}`;
}

function formatLastLogin(lastLogin) {
    if (!lastLogin) return "Never logged in";
    const date = new Date(typeof lastLogin === "string" ? lastLogin.replace(/^(\d{4}-\d{2}-\d{2})\s/, "$1T") : lastLogin);
    return Number.isNaN(date.getTime())
        ? "Unavailable"
        : new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function StudentsView() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    const loadStudents = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await apiRequest("/api/students/", { method: "GET" });
            setStudents(data.students || []);
        } catch (loadError) {
            if (loadError.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }
            setError(loadError.status === 403
                ? "You do not have permission to access students."
                : loadError.message || "Failed to retrieve students.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    const filteredStudents = useMemo(() => {
        const term = normalize(searchTerm);
        if (!term) return students;
        return students.filter((student) => {
            const haystack = normalize([
                student.registration_no,
                student.first_name,
                student.last_name,
                `${student.first_name ?? ""} ${student.last_name ?? ""}`,
                student.email
            ].join(" "));
            return haystack.includes(term);
        });
    }, [students, searchTerm]);

    const handleDelete = async (studentId) => {
        if (!window.confirm("Are you sure you want to delete this student?")) return;
        try {
            await apiRequest(`/api/students/${studentId}`, { method: "DELETE" });
            await loadStudents();
        } catch (deleteError) {
            if (deleteError.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }
            setError(deleteError.message || "Failed to delete student.");
        }
    };

    const handleExportCsv = () => {
        if (!students.length) {
            setError("There are no student records to export.");
            return;
        }
        const headings = ["Registration No.", "First Name", "Last Name", "Email", "Phone", "Last Login"];
        const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
        const rows = students.map((student) =>
            [student.registration_no, student.first_name, student.last_name, student.email, student.phone_number, student.last_login ?? "Never logged in"]
                .map(escape).join(",")
        );
        const blob = new Blob(["\uFEFF" + [headings.map(escape).join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `student_records_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setError("");
    };

    return (
        <>
            <div className="students-heading">
                <div>
                    <h2>Students</h2>
                    <p>Manage student accounts and profiles.</p>
                </div>
                <div className="students-heading-actions">
                    <button type="button" className="export-csv-button" onClick={handleExportCsv} disabled={loading || !students.length}>
                        Export CSV
                    </button>
                    <button type="button" className="add-student-button" onClick={() => { setEditingStudent(null); setShowForm(true); }}>
                        + Add Student
                    </button>
                </div>
            </div>

            {error && <div className="dashboard-error" role="alert">{error}</div>}

            <StudentFormModal
                show={showForm}
                editingStudent={editingStudent}
                onClose={() => { setShowForm(false); setEditingStudent(null); }}
                onSuccess={loadStudents}
                onAuthError={() => { logout(); navigate("/login", { replace: true }); }}
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
                {searchTerm && (
                    <button type="button" className="students-search-clear" onClick={() => setSearchTerm("")}>Clear</button>
                )}
            </div>

            {!loading && students.length > 0 && (
                <p className="students-result-count">
                    {searchTerm ? `${filteredStudents.length} ${filteredStudents.length === 1 ? "student" : "students"} found` : `${students.length} ${students.length === 1 ? "student" : "students"}`}
                </p>
            )}

            <div className="students-card">
                {loading ? (
                    <div className="students-loading">Loading students...</div>
                ) : students.length === 0 ? (
                    <div className="students-empty"><h3>No students found</h3><p>Add your first student to get started.</p></div>
                ) : filteredStudents.length === 0 ? (
                    <div className="students-empty">
                        <h3>No matching students found</h3>
                        <p>No students match &quot;{searchTerm.trim()}&quot;.</p>
                        <button type="button" className="students-search-clear" onClick={() => setSearchTerm("")}>Clear Search</button>
                    </div>
                ) : (
                    <div className="students-table-wrapper">
                        <table className="students-table">
                            <thead>
                                <tr><th>Profile</th><th>Registration No.</th><th>Name</th><th>Email</th><th>Phone</th><th>Last Login</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => (
                                    <tr key={student.student_id}>
                                        <td>
                                            <div className="student-profile-cell">
                                                {getPhotoUrl(student.profile_photo) && (
                                                    <img className="student-profile-image" src={getPhotoUrl(student.profile_photo)} alt={`${student.first_name ?? "Student"} profile`} loading="lazy" />
                                                )}
                                                <span className="student-profile-placeholder">
                                                    {`${student.first_name?.charAt(0) ?? ""}${student.last_name?.charAt(0) ?? ""}`.toUpperCase() || "?"}
                                                </span>
                                            </div>
                                        </td>
                                        <td><strong>{student.registration_no}</strong></td>
                                        <td>{student.first_name} {student.last_name}</td>
                                        <td>{student.email}</td>
                                        <td>{student.phone_number}</td>
                                        <td className="student-last-login">{formatLastLogin(student.last_login)}</td>
                                        <td>
                                            <div className="student-actions">
                                                <button type="button" className="edit-button" onClick={() => { setEditingStudent(student); setShowForm(true); }}>Edit</button>
                                                <button type="button" className="delete-button" onClick={() => handleDelete(student.student_id)}>Delete</button>
                                            </div>
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
