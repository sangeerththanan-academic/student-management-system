import { useEffect, useState } from "react";
import CourseFormModal from "../../components/CourseFormModal";
import "../../components/dashboard-sidebar.css";
import { getCourses } from "../../services/courseService";

function CoursesView() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        let active = true;

        getCourses()
            .then((data) => {
                if (active) {
                    setCourses(data);
                }
            })
            .catch((requestError) => {
                console.error("Failed to load courses:", requestError);
                if (active) {
                    setError(requestError.message || "Failed to load courses.");
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    const handleCourseCreated = (course) => {
        setCourses((previousCourses) => [course, ...previousCourses]);
        setError("");
    };

    return (
        <section className="courses-view dashboard-content">
            <div className="view-header">
                <div>
                    <h2>Courses</h2>
                    <p>Total Courses: {courses.length}</p>
                </div>
                <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setShowForm(true)}
                >
                    + Add Course
                </button>
            </div>

            {error && <div className="dashboard-error" role="alert">{error}</div>}

            {loading ? (
                <div className="empty-state" role="status">Loading courses...</div>
            ) : error ? null : courses.length === 0 ? (
                <div className="empty-state">
                    <h3>No Courses Found</h3>
                    <p>There are no courses available. Add a course to get started.</p>
                </div>
            ) : (
                <div className="courses-table-wrapper">
                    <table className="data-table">
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
                                <tr key={course.id}>
                                    <td><strong>{course.course_code}</strong></td>
                                    <td>{course.course_name}</td>
                                    <td>{course.description || "-"}</td>
                                    <td>{course.credits}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <CourseFormModal
                    onClose={() => setShowForm(false)}
                    onCreated={handleCourseCreated}
                />
            )}
        </section>
    );
}

export default CoursesView;
