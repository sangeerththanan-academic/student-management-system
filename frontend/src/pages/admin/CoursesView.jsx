import { useCallback, useEffect, useState } from "react";
import { BookOpen, Plus, RefreshCw } from "lucide-react";
import apiRequest from "../../services/api";
import CourseFormModal from "../../components/CourseFormModal";

function CoursesView() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    const loadCourses = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const data = await apiRequest("/api/courses", { method: "GET" });
            setCourses(data.courses || []);
        } catch (err) {
            setError(err.message || "Failed to retrieve courses.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(loadCourses, 0);
        return () => window.clearTimeout(timeout);
    }, [loadCourses]);

    return (
        <section className="dashboard-module">
            <div className="module-eyebrow"><BookOpen size={15} /> COURSE MANAGEMENT</div>
            <div className="students-heading">
                <div><h2>Courses</h2><p>Manage the courses offered by your institution.</p></div>
                <button className="add-student-button" onClick={() => setShowForm(true)}><Plus size={17} /> Add Course</button>
            </div>
            {error && <div className="dashboard-error">{error}</div>}
            <CourseFormModal show={showForm} onClose={() => setShowForm(false)} onSuccess={loadCourses} />
            {loading ? <div className="courses-state">Loading courses...</div> : courses.length === 0 ? (
                <div className="courses-empty"><span className="courses-empty-icon"><BookOpen size={25} /></span><h3>No courses yet</h3><p>Add your first course to start building the course catalogue.</p><button className="add-student-button" onClick={() => setShowForm(true)}><Plus size={17} /> Add Course</button></div>
            ) : (
                <div className="students-card"><div className="courses-list-heading"><div><h3>Course catalogue</h3><p>{courses.length} {courses.length === 1 ? "course" : "courses"}</p></div><button className="icon-action-button" onClick={loadCourses} aria-label="Refresh courses"><RefreshCw size={16} /></button></div><div className="students-table-wrapper"><table className="students-table courses-table"><thead><tr><th>Course Code</th><th>Course Name</th><th>Description</th><th>Credits</th></tr></thead><tbody>{courses.map((course) => <tr key={course.course_id}><td><span className="course-code-badge">{course.course_code}</span></td><td><strong>{course.course_name}</strong></td><td className="course-description-cell">{course.description}</td><td>{course.credits}</td></tr>)}</tbody></table></div></div>
            )}
        </section>
    );
}

export default CoursesView;



