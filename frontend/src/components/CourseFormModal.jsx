import { useEffect, useState } from "react";

const INITIAL_DATA = {
    courseCode: "",
    courseName: "",
    description: "",
    credits: ""
};

function CourseFormModal({ show, onClose, onSubmit, submitting, error }) {
    const [formData, setFormData] = useState(INITIAL_DATA);
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        if (show) {
            setFormData(INITIAL_DATA);
            setFieldErrors({});
        }
    }, [show]);

    if (!show) return null;

    const validate = () => {
        const errors = {};
        if (!formData.courseCode.trim()) errors.courseCode = "Course code is required.";
        if (!formData.courseName.trim()) errors.courseName = "Course name is required.";
        if (!formData.description.trim()) errors.description = "Description is required.";

        const credits = Number(formData.credits);
        if (!formData.credits) errors.credits = "Credits are required.";
        else if (!Number.isInteger(credits) || credits < 1 || credits > 30) {
            errors.credits = "Credits must be a whole number from 1 to 30.";
        }
        return errors;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const errors = validate();
        setFieldErrors(errors);
        if (Object.keys(errors).length) return;

        onSubmit({
            courseCode: formData.courseCode.trim(),
            courseName: formData.courseName.trim(),
            description: formData.description.trim(),
            credits: Number(formData.credits)
        });
    };

    return (
        <div className="modal-overlay" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
        }}>
            <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="course-modal-title">
                <div className="course-form-card">
                    <div className="form-card-header">
                        <div>
                            <h3 id="course-modal-title">Add Course</h3>
                            <p>Create a new course record.</p>
                        </div>
                        <button type="button" className="close-form-button" onClick={onClose} aria-label="Close">×</button>
                    </div>

                    {error && <div className="dashboard-error" role="alert">{error}</div>}

                    <form className="course-form" onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label htmlFor="courseCode">Course Code</label>
                            <input id="courseCode" value={formData.courseCode} onChange={(event) => setFormData({ ...formData, courseCode: event.target.value })} />
                            {fieldErrors.courseCode && <span className="field-error">{fieldErrors.courseCode}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="courseName">Course Name</label>
                            <input id="courseName" value={formData.courseName} onChange={(event) => setFormData({ ...formData, courseName: event.target.value })} />
                            {fieldErrors.courseName && <span className="field-error">{fieldErrors.courseName}</span>}
                        </div>
                        <div className="form-group course-description-field">
                            <label htmlFor="description">Description</label>
                            <textarea id="description" rows="4" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} />
                            {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="credits">Credits</label>
                            <input id="credits" type="number" min="1" max="30" value={formData.credits} onChange={(event) => setFormData({ ...formData, credits: event.target.value })} />
                            {fieldErrors.credits && <span className="field-error">{fieldErrors.credits}</span>}
                        </div>
                        <div className="form-actions">
                            <button type="button" className="cancel-button" onClick={onClose} disabled={submitting}>Cancel</button>
                            <button type="submit" className="save-button" disabled={submitting}>{submitting ? "Saving..." : "Save Course"}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CourseFormModal;
