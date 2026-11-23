import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { logout } from "../../services/authService";
import { getCourses } from "../../services/courseService";
import CourseFormModal from "../../components/CourseFormModal";

function CoursesView() {
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);

    const loadCourses = useCallback(() => {
        return getCourses()
            .then((data) => {
                setCourses(data.courses || []);
                setError("");
            })
            .catch((err) => {
                console.error("Failed to load courses:", err);

                if (err.status === 401) {
                    logout();
                    navigate("/login", { replace: true });
                    return;
                }

                if (err.status === 403) {
                    setError("You do not have permission to access courses.");
                    return;
                }

                setError(err.message || "Failed to retrieve courses.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [navigate]);

    useEffect(() => {
        let active = true;
        getCourses()
            .then((data) => {
                if (active) {
                    setCourses(data.courses || []);
                    setError("");
                }
            })
            .catch((err) => {
                if (!active) return;
                console.error("Failed to load courses:", err);

                if (err.status === 401) {
                    logout();
                    navigate("/login", { replace: true });
                    return;
                }

                if (err.status === 403) {
                    setError("You do not have permission to access courses.");
                    return;
                }

                setError(err.message || "Failed to retrieve courses.");
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

    const handleAuthError = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="courses-view-container">
            {/* FR-011, AC-006: Heading consistent with Students section */}
            <div className="students-heading">
                <div>
                    <h2>Courses</h2>
                    <p>Manage curriculum courses and course details.</p>
                </div>

                {/* FR-012, AC-006: Add Course Action */}
                <button
                    className="add-student-button"
                    onClick={() => setShowModal(true)}
                >
                    + Add Course
                </button>
            </div>

            {/* Error display */}
            {error && (
                <div className="dashboard-error">
                    {error}
                </div>
            )}

            {/* Course Form Modal */}
            <CourseFormModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={loadCourses}
                onAuthError={handleAuthError}
            />

            {/* Course count indicator */}
            {!loading && courses.length > 0 && (
                <p className="students-result-count">
                    {courses.length} {courses.length === 1 ? "course" : "courses"} registered
                </p>
            )}

            {/* Courses Card */}
            <div className="students-card">
                {loading ? (
                    <div className="students-loading">
                        Loading courses...
                    </div>
                ) : courses.length === 0 ? (
                    /* FR-013, AC-006: Empty State */
                    <div className="students-empty">
                        <h3>No courses found</h3>
                        <p>Add your first course to get started.</p>
                        <button
                            type="button"
                            className="add-student-button"
                            style={{ marginTop: "16px" }}
                            onClick={() => setShowModal(true)}
                        >
                            + Add Course
                        </button>
                    </div>
                ) : (
                    /* FR-014, AC-006: Course List / Table */
                    <div className="students-table-wrapper">
                        <table className="students-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "15%" }}>Course Code</th>
                                    <th style={{ width: "30%" }}>Course Name</th>
                                    <th style={{ width: "40%" }}>Description</th>
                                    <th style={{ width: "15%" }}>Credits</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map((course) => (
                                    <tr key={course.course_id}>
                                        <td>
                                            <strong>{course.course_code}</strong>
                                        </td>
                                        <td>{course.course_name}</td>
                                        <td>
                                            {course.description || (
                                                <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                                                    No description
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="course-credits-badge">
                                                {course.credits} {course.credits === 1 ? "Credit" : "Credits"}
                                            </span>
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

export default CoursesView;
