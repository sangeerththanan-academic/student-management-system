import { useState } from "react";
import { createCourse } from "../services/courseService";

const initialFormState = {
    courseCode: "",
    courseName: "",
    description: "",
    credits: ""
};

function CourseFormModal({
    show,
    onClose,
    onSuccess,
    onAuthError
}) {
    const [formData, setFormData] = useState(initialFormState);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleClose = () => {
        setFormData(initialFormState);
        setFormError("");
        onClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        const courseCode = formData.courseCode.trim();
        const courseName = formData.courseName.trim();
        const description = formData.description.trim();
        const credits = formData.credits.trim();

        // FR-020, AC-008: Validate submitted input before sending
        if (!courseCode) {
            setFormError("Course Code is required.");
            return;
        }

        if (!courseName) {
            setFormError("Course Name is required.");
            return;
        }

        if (credits === "") {
            setFormError("Credits field is required.");
            return;
        }

        const numericCredits = Number(credits);
        if (isNaN(numericCredits) || numericCredits < 0 || !Number.isInteger(numericCredits)) {
            setFormError("Credits must be a valid non-negative integer.");
            return;
        }

        try {
            setFormLoading(true);

            // FR-021, AC-009: API submission for course creation
            await createCourse({
                courseCode,
                courseName,
                description,
                credits: numericCredits
            });

            setFormData(initialFormState);
            onSuccess();
            onClose();

        } catch (error) {
            console.error("Course save error:", error);

            if (error.status === 401) {
                if (onAuthError) {
                    onAuthError();
                }
                return;
            }

            if (error.status === 403) {
                setFormError("You do not have permission to create courses.");
                return;
            }

            setFormError(
                error.message || "Failed to create course."
            );

        } finally {
            setFormLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div
                className="modal-content student-form-card"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="form-card-header">
                    <div>
                        <h3>Add New Course</h3>
                        <p>Create a new course record.</p>
                    </div>

                    <button
                        type="button"
                        className="close-form-button"
                        onClick={handleClose}
                    >
                        ×
                    </button>
                </div>

                {formError && (
                    <div className="dashboard-error">
                        {formError}
                    </div>
                )}

                <form
                    className="student-form course-form"
                    onSubmit={handleSubmit}
                >
                    <div className="form-group">
                        <label htmlFor="courseCode">
                            Course Code *
                        </label>
                        <input
                            id="courseCode"
                            type="text"
                            name="courseCode"
                            placeholder="e.g. CS101"
                            value={formData.courseCode}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="courseName">
                            Course Name *
                        </label>
                        <input
                            id="courseName"
                            type="text"
                            name="courseName"
                            placeholder="e.g. Introduction to Computer Science"
                            value={formData.courseName}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="credits">
                            Credits *
                        </label>
                        <input
                            id="credits"
                            type="number"
                            name="credits"
                            min="0"
                            step="1"
                            placeholder="e.g. 3"
                            value={formData.credits}
                            onChange={handleInputChange}
                            disabled={formLoading}
                            required
                        />
                    </div>

                    <div className="form-group full-width">
                        <label htmlFor="description">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows="3"
                            placeholder="Optional course description..."
                            value={formData.description}
                            onChange={handleInputChange}
                            disabled={formLoading}
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={handleClose}
                            disabled={formLoading}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="save-button"
                            disabled={formLoading}
                        >
                            {formLoading ? "Saving..." : "Save Course"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CourseFormModal;
