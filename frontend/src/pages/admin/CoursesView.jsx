import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CourseFormModal from "../../components/CourseFormModal";
import { createCourse, getCourses } from "../../services/courseService";
import { logout } from "../../services/authService";

function CoursesView() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const loadCourses = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getCourses();
            setCourses(data.courses || []);
        } catch (loadError) {
            if (loadError.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }
            setError(loadError.message || "Failed to retrieve courses.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
    }, []);

    const handleCreate = async (course) => {
        try {
            setSubmitting(true);
            setError("");
            await createCourse(course);
            setShowModal(false);
            await loadCourses();
        } catch (submitError) {
            if (submitError.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return;
            }
            setError(submitError.message || "Failed to create course.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="students-heading">
                <div>
                    <h2>Courses</h2>
                    <p>Manage course records.</p>
                </div>
                <button type="button" className="add-student-button" onClick={() => { setError(""); setShowModal(true); }}>
                    + Add Course
                </button>
            </div>

            {error && !showModal && <div className="dashboard-error" role="alert">{error}</div>}

            <CourseFormModal
                show={showModal}
                onClose={() => { if (!submitting) setShowModal(false); }}
                onSubmit={handleCreate}
                submitting={submitting}
                error={error}
            />

            <div className="students-card">
                {loading ? (
                    <div className="students-loading">Loading courses...</div>
                ) : courses.length === 0 ? (
                    <div className="students-empty">
                        <h3>No courses available</h3>
                        <p>Add your first course to get started.</p>
                    </div>
                ) : (
                    <div className="students-table-wrapper">
                        <table className="students-table courses-table">
                            <thead>
                                <tr><th>Course Code</th><th>Course Name</th><th>Description</th><th>Credits</th></tr>
                            </thead>
                            <tbody>
                                {courses.map((course) => (
                                    <tr key={course.course_id}>
                                        <td><strong>{course.course_code}</strong></td>
                                        <td>{course.course_name}</td>
                                        <td>{course.description}</td>
                                        <td>{course.credits}</td>
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

export default CoursesView;
