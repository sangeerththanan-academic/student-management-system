import { useState } from "react";
import apiRequest from "../services/api";

const emptyCourse = { courseCode: "", courseName: "", description: "", credits: "" };

function CourseFormModal({ show, onClose, onSuccess }) {
    const [course, setCourse] = useState(emptyCourse);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    if (!show) return null;

    const update = (event) => setCourse((current) => ({ ...current, [event.target.name]: event.target.value }));
    const submit = async (event) => {
        event.preventDefault();
        const payload = { ...course, courseCode: course.courseCode.trim().toUpperCase(), courseName: course.courseName.trim(), description: course.description.trim(), credits: Number(course.credits) };
        if (!/^[A-Z0-9-]{2,30}$/.test(payload.courseCode) || !payload.courseName || !payload.description || !Number.isInteger(payload.credits) || payload.credits < 1 || payload.credits > 30) {
            setError("Enter a valid code, name, description, and credits from 1 to 30.");
            return;
        }
        try {
            setSaving(true);
            setError("");
            await apiRequest("/api/courses", { method: "POST", body: JSON.stringify(payload) });
            setCourse(emptyCourse);
            await onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || "Could not save the course.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <div className="modal-content student-form-card" role="dialog" aria-modal="true" aria-labelledby="course-form-title">
                <div className="form-card-header"><div><h3 id="course-form-title">Add Course</h3><p>Enter the course details below.</p></div><button type="button" className="close-form-button" onClick={onClose} aria-label="Close">×</button></div>
                {error && <div className="dashboard-error">{error}</div>}
                <form className="student-form" onSubmit={submit}>
                    <div className="form-group"><label htmlFor="courseCode">Course Code</label><input id="courseCode" name="courseCode" value={course.courseCode} onChange={update} maxLength={30} required placeholder="e.g. ICT101" /></div>
                    <div className="form-group"><label htmlFor="courseName">Course Name</label><input id="courseName" name="courseName" value={course.courseName} onChange={update} maxLength={150} required /></div>
                    <div className="form-group course-description-field"><label htmlFor="description">Description</label><textarea id="description" name="description" value={course.description} onChange={update} rows={4} required /></div>
                    <div className="form-group"><label htmlFor="credits">Credits</label><input id="credits" name="credits" type="number" min="1" max="30" step="1" value={course.credits} onChange={update} required /></div>
                    <div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button type="submit" className="save-button" disabled={saving}>{saving ? "Saving..." : "Save Course"}</button></div>
                </form>
            </div>
        </div>
    );
}

export default CourseFormModal;
