import { useEffect, useState } from "react";

import apiRequest from "../../services/api";
import CourseFormModal from "../../components/CourseFormModal";

function CoursesView() {
    const [courses, setCourses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);

    // Load courses.
    const loadCourses = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await apiRequest(
                "/api/courses",
                {
                    method: "GET"
                }
            );

            setCourses(data.courses || []);

        } catch (error) {
            console.error(
                "Failed to load courses:",
                error
            );

            setError(
                error.message || "Failed to retrieve courses."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
    }, []);

    // Form handling.
    const openAddForm = () => {
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
    };

    return (
        <main className="dashboard-content">

            <div className="students-heading">
                <div>
                    <h2>Courses</h2>
                    <p>
                        Manage available courses.
                    </p>
                </div>

                <div className="students-heading-actions">

                    <button
                        type="button"
                        className="add-student-button"
                        onClick={openAddForm}
                    >
                        + Add Course
                    </button>

                </div>
            </div>

            {error && (
                <div className="dashboard-error">
                    {error}
                </div>
            )}

            <CourseFormModal
                show={showForm}
                onClose={handleFormClose}
                onSuccess={loadCourses}
            />

            <div className="students-card">

                {loading ? (
                    <div className="students-loading">
                        Loading courses...
                    </div>

                ) : courses.length === 0 ? (
                    <div className="students-empty">
                        <h3>No courses found</h3>
                        <p>
                            Add your first course to get started.
                        </p>
                    </div>

                ) : (
                    <div className="students-table-wrapper">

                        <table className="students-table">

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

                                        <td>
                                            <strong>
                                                {course.course_code}
                                            </strong>
                                        </td>

                                        <td>
                                            {course.course_name}
                                        </td>

                                        <td>
                                            {course.description || "-"}
                                        </td>

                                        <td>
                                            {course.credits}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>
                )}

            </div>

        </main>
    );
}

export default CoursesView;