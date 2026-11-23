// CR006: Course creation form modal.
import { useState } from "react";
import { createCourse } from "../services/api";

const initialForm = {
    courseCode: "",
    courseName: "",
    description: "",
    credits: ""
};

function CourseFormModal({ show, onClose, onSuccess, onAuthError }) {
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!show) return null;

    const validate = () => {
        const nextErrors = {};
        const courseCode = form.courseCode.trim();
        const courseName = form.courseName.trim();
        const credits = Number(form.credits);

        if (!courseCode) {
            nextErrors.courseCode = "Course code is required.";
        } else if (!/^[A-Za-z0-9-]{2,20}$/.test(courseCode)) {
            nextErrors.courseCode =
                "Course code must contain 2-20 letters, numbers, or hyphens.";
        }

        if (!courseName) {
            nextErrors.courseName = "Course name is required.";
        } else if (courseName.length < 3) {
            nextErrors.courseName =
                "Course name must contain at least 3 characters.";
        }

        if (form.description.trim().length > 1000) {
            nextErrors.description =
                "Description must not exceed 1000 characters.";
        }

        if (form.credits === "") {
            nextErrors.credits = "Credits are required.";
        } else if (!Number.isInteger(credits) || credits < 1 || credits > 30) {
            nextErrors.credits =
                "Credits must be a whole number from 1 to 30.";
        }

        return nextErrors;
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: undefined }));
        setServerError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setSubmitting(true);
            setServerError("");
            await createCourse({
                courseCode: form.courseCode.trim(),
                courseName: form.courseName.trim(),
                description: form.description.trim(),
                credits: Number(form.credits)
            });
            setForm(initialForm);
            setErrors({});
            onSuccess();
            onClose();
        } catch (error) {
            if (error.status === 401) {
                onAuthError();
                return;
            }
            setErrors(error.data?.errors || {});
            setServerError(error.message || "Failed to create course.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
            <div
                className="modal-content course-form-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="course-modal-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="form-card-header">
                    <div>
                        <h3 id="course-modal-title">Add Course</h3>
                        <p>Create a new course record.</p>
                    </div>
                    <button
                        type="button"
                        className="close-form-button"
                        onClick={onClose}
                        aria-label="Close course form"
                    >
                        ×
                    </button>
                </div>

                {serverError && (
                    <div className="dashboard-error" role="alert">
                        {serverError}
                    </div>
                )}

                <form className="course-form" onSubmit={handleSubmit}>
                    <div className={`form-group${errors.courseCode ? " field-error" : ""}`}>
                        <label htmlFor="courseCode">Course Code</label>
                        <input
                            id="courseCode"
                            name="courseCode"
                            value={form.courseCode}
                            onChange={handleChange}
                            placeholder="e.g. ICT101"
                        />
                        {errors.courseCode && (
                            <span className="field-error-msg">{errors.courseCode}</span>
                        )}
                    </div>

                    <div className={`form-group${errors.courseName ? " field-error" : ""}`}>
                        <label htmlFor="courseName">Course Name</label>
                        <input
                            id="courseName"
                            name="courseName"
                            value={form.courseName}
                            onChange={handleChange}
                            placeholder="Course name"
                        />
                        {errors.courseName && (
                            <span className="field-error-msg">{errors.courseName}</span>
                        )}
                    </div>

                    <div className={`form-group course-description${errors.description ? " field-error" : ""}`}>
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Optional course description"
                        />
                        {errors.description && (
                            <span className="field-error-msg">{errors.description}</span>
                        )}
                    </div>

                    <div className={`form-group${errors.credits ? " field-error" : ""}`}>
                        <label htmlFor="credits">Credits</label>
                        <input
                            id="credits"
                            name="credits"
                            type="number"
                            min="1"
                            max="30"
                            value={form.credits}
                            onChange={handleChange}
                            placeholder="e.g. 3"
                        />
                        {errors.credits && (
                            <span className="field-error-msg">{errors.credits}</span>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-button" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="save-button" disabled={submitting}>
                            {submitting ? "Creating..." : "Create Course"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CourseFormModal;