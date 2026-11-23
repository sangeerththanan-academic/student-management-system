// CR006: Course management module.
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { getCourses } from "../../services/api";
import CourseFormModal from "../../components/CourseFormModal";

function CoursesView() {
    const { redirectToLogin } = useOutletContext();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    const loadCourses = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getCourses();
            setCourses(Array.isArray(data.courses) ? data.courses : []);
        } catch (err) {
            if (err.status === 401) {
                redirectToLogin();
                return;
            }
            setError(
                err.status === 403
                    ? "You do not have permission to access courses."
                    : err.message || "Failed to retrieve courses."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
    }, []);

    return (
        <>
            <div className="courses-heading students-heading">
                <div>
                    <h2>Courses</h2>
                    <p>Manage course records.</p>
                </div>
                <button
                    type="button"
                    className="add-student-button"
                    onClick={() => setShowForm(true)}
                >
                    + Add Course
                </button>
            </div>

            {error && <div className="dashboard-error" role="alert">{error}</div>}

            <CourseFormModal
                show={showForm}
                onClose={() => setShowForm(false)}
                onSuccess={loadCourses}
                onAuthError={redirectToLogin}
            />

            <div className="students-card courses-card">
                {loading ? (
                    <div className="students-loading">Loading courses...</div>
                ) : courses.length === 0 ? (
                    <div className="students-empty">
                        <h3>No courses found</h3>
                        <p>Add your first course to get started.</p>
                    </div>
                ) : (
                    <div className="students-table-wrapper">
                        <table className="students-table courses-table">
                            <thead>
                                <tr>
                                    <th>Course Code</th>
                                    <th>Course Name</th>
                                    <th>Description</th>
                                    <th>Credits</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map((course) => (
                                    <tr key={course.course_id}>
                                        <td><strong>{course.course_code}</strong></td>
                                        <td>{course.course_name}</td>
                                        <td>{course.description || "—"}</td>
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