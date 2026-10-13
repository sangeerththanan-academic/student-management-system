import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

import {
    getStoredUser,
    getCurrentUser,
    logout
} from "../services/authService";

import apiRequest from "../services/api";
import StudentFormModal from "../components/StudentFormModal";
import ThemeToggle from "../components/ThemeToggle";

const DashboardPage = () => {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // ==================================================
    // LOAD CURRENT USER
    // ==================================================

    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUser = getStoredUser();

                if (!storedUser) {
                    navigate("/login");
                    return;
                }

                const response = await getCurrentUser();

                if (response?.success) {
                    setUser(response.user);
                } else {
                    setUser(storedUser);
                }
            } catch (err) {
                console.error("Failed to load user:", err);
                navigate("/login");
            }
        };

        loadUser();
    }, [navigate]);

    // ==================================================
    // LOAD STUDENTS
    // ==================================================

    const loadStudents = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await apiRequest("/api/students/");

            if (response?.success) {
                setStudents(response.students || []);
            } else {
                setStudents([]);
                setError(
                    response?.message ||
                    "Failed to load students."
                );
            }

        } catch (err) {
            console.error("Failed to load students:", err);

            setError(
                err.message ||
                "Failed to load students."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    // ==================================================
    // SEARCH STUDENTS
    // ==================================================

    const filteredStudents = useMemo(() => {

        const search = searchTerm
            .trim()
            .toLowerCase();

        if (!search) {
            return students;
        }

        return students.filter((student) => {

            const registrationNo =
                student.registration_no?.toLowerCase() || "";

            const firstName =
                student.first_name?.toLowerCase() || "";

            const lastName =
                student.last_name?.toLowerCase() || "";

            const fullName =
                `${student.first_name || ""} ${student.last_name || ""}`
                    .trim()
                    .toLowerCase();

            const email =
                student.email?.toLowerCase() || "";

            return (
                registrationNo.includes(search) ||
                firstName.includes(search) ||
                lastName.includes(search) ||
                fullName.includes(search) ||
                email.includes(search)
            );
        });

    }, [students, searchTerm]);

    // ==================================================
    // ADD STUDENT
    // ==================================================

    const openAddForm = () => {
        setEditingStudent(null);
        setShowForm(true);
    };

    // ==================================================
    // EDIT STUDENT
    // ==================================================

    const openEditForm = (student) => {
        setEditingStudent(student);
        setShowForm(true);
    };

    // ==================================================
    // CLOSE FORM
    // ==================================================

    const closeForm = () => {
        setShowForm(false);
        setEditingStudent(null);
    };

    // ==================================================
    // DELETE STUDENT
    // ==================================================

    const handleDelete = async (studentId) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this student?"
        );

        if (!confirmDelete) {
            return;
        }

        try {

            setError("");

            const response = await apiRequest(
                `/api/students/${studentId}`,
                { method: "DELETE" }
            );

            if (response?.success) {

                alert("Student deleted successfully.");

                await loadStudents();

            } else {

                alert(
                    response?.message ||
                    "Failed to delete student."
                );
            }

        } catch (err) {

            console.error(
                "Delete student error:",
                err
            );

            alert(
                err.message ||
                "Failed to delete student."
            );
        }
    };

    // ==================================================
    // LOGOUT
    // ==================================================

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // ==================================================
    // FORM SUCCESS
    // ==================================================

    const handleFormSuccess = async () => {
        closeForm();
        await loadStudents();
    };

    // ==================================================
    // FORMAT LAST LOGIN
    // ==================================================

    const formatLastLogin = (lastLogin) => {

        if (!lastLogin) {
            return "Never logged in";
        }

        const date = new Date(lastLogin);

        if (Number.isNaN(date.getTime())) {
            return "Never logged in";
        }

        return date.toLocaleString("en-LK", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // ==================================================
    // CLEAR SEARCH
    // ==================================================

    const clearSearch = () => {
        setSearchTerm("");
    };

    // ==================================================
    // RENDER
    // ==================================================

    return (
        <div className="dashboard-page">

            {/* ==================================================
                HEADER
            ================================================== */}

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

                    {user && (
                        <div className="admin-info">

                            <strong>
                                Welcome, {user.username}
                            </strong>

                            <span>
                                ADMINISTRATOR
                            </span>

                        </div>
                    )}

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </header>

            {/* ==================================================
                MAIN CONTENT
            ================================================== */}

            <main className="dashboard-content">

                {/* Students Heading */}

                <div className="students-heading">

                    <div>

                        <h2>
                            Students
                        </h2>

                        <p>
                            Total Students: {students.length}
                        </p>

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

                {/* ==================================================
                    STUDENTS CARD
                ================================================== */}

                <div className="students-card">

                    {/* Search */}

                    <div className="students-search">

                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(e.target.value)
                            }
                            placeholder="Search by registration number, name or email..."
                            className="students-search-input"
                        />

                        {searchTerm && (
                            <button
                                className="students-search-clear"
                                onClick={clearSearch}
                            >
                                Clear
                            </button>
                        )}

                    </div>

                    {/* Result Count */}

                    {!loading && (
                        <p className="students-result-count">

                            Showing{" "}
                            <strong>
                                {filteredStudents.length}
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {students.length}
                            </strong>{" "}
                            students

                        </p>
                    )}

                    {/* ==================================================
                        LOADING
                    ================================================== */}

                    {loading ? (

                        <div className="students-loading">
                            Loading students...
                        </div>

                    ) : filteredStudents.length === 0 ? (

                        /* ==================================================
                           EMPTY
                        ================================================== */

                        <div className="students-empty">

                            <h3>
                                No Students Found
                            </h3>

                            <p>
                                {searchTerm
                                    ? "No students match your search."
                                    : "There are no students available."}
                            </p>

                            {searchTerm && (
                                <button
                                    className="students-search-clear"
                                    onClick={clearSearch}
                                >
                                    Clear Search
                                </button>
                            )}

                        </div>

                    ) : (

                        /* ==================================================
                           TABLE
                        ================================================== */

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

                                    {filteredStudents.map(
                                        (student) => (

                                            <tr
                                                key={
                                                    student.student_id
                                                }
                                            >

                                                <td>
                                                    <strong>
                                                        {
                                                            student.registration_no
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    {
                                                        student.first_name
                                                    }{" "}
                                                    {
                                                        student.last_name
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        student.email
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        student.phone_number
                                                    }
                                                </td>

                                                {/* ==========================
                                                    LAST LOGIN
                                                ========================== */}

                                                <td>

                                                    {student.last_login ? (

                                                        <span className="last-login">
                                                            {formatLastLogin(
                                                                student.last_login
                                                            )}
                                                        </span>

                                                    ) : (

                                                        <span className="never-login">
                                                            Never logged in
                                                        </span>

                                                    )}

                                                </td>

                                                {/* ==========================
                                                    ACTIONS
                                                ========================== */}

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

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                </div>

            </main>

            {/* ==================================================
                ADD / EDIT STUDENT MODAL
            ================================================== */}

            {showForm && (

                <StudentFormModal
                    student={editingStudent}
                    onClose={closeForm}
                    onSuccess={handleFormSuccess}
                />

            )}

        </div>
    );
};

export default DashboardPage;

