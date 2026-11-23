import { useState } from "react";

import apiRequest from "../services/api";

function CourseFormModal({ show, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        course_code: "",
        course_name: "",
        description: "",
        credits: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!show) {
        return null;
    }

    // Handle input changes.
    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // Reset form.
    const resetForm = () => {
        setFormData({
            course_code: "",
            course_name: "",
            description: "",
            credits: ""
        });

        setError("");
    };

    // Close form.
    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Add course.
    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        const courseCode = formData.course_code.trim();
        const courseName = formData.course_name.trim();
        const credits = Number(formData.credits);

        if (!courseCode || !courseName || !formData.credits) {
            setError("Please fill in all required fields.");
            return;
        }

        if (
            !Number.isInteger(credits) ||
            credits <= 0
        ) {
            setError("Credits must be a positive whole number.");
            return;
        }

        try {
            setLoading(true);

            await apiRequest(
                "/api/courses",
                {
                    method: "POST",
                    body: JSON.stringify({
                        course_code: courseCode,
                        course_name: courseName,
                        description: formData.description.trim(),
                        credits
                    })
                }
            );

            resetForm();
            onSuccess();
            onClose();

        } catch (error) {
            console.error("Add course error:", error);

            setError(
                error.message || "Failed to add course."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">

            <div className="modal-content">

                <div className="course-form-card">

                    <div className="form-card-header">
                        <div>
                            <h3>Add New Course</h3>
                            <p>
                                Enter the course details below.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="close-form-button"
                            onClick={handleClose}
                        >
                            ×
                        </button>
                    </div>

                    {error && (
                        <div className="dashboard-error">
                            {error}
                        </div>
                    )}

                    <form
                        className="course-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="form-group">
                            <label htmlFor="course_code">
                                Course Code
                            </label>

                            <input
                                type="text"
                                id="course_code"
                                name="course_code"
                                value={formData.course_code}
                                onChange={handleChange}
                                placeholder="Enter course code"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="course_name">
                                Course Name
                            </label>

                            <input
                                type="text"
                                id="course_name"
                                name="course_name"
                                value={formData.course_name}
                                onChange={handleChange}
                                placeholder="Enter course name"
                                required
                            />
                        </div>

                        <div className="form-group course-description-group">
                            <label htmlFor="description">
                                Description
                            </label>

                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Enter course description"
                                rows="4"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="credits">
                                Credits
                            </label>

                            <input
                                type="number"
                                id="credits"
                                name="credits"
                                value={formData.credits}
                                onChange={handleChange}
                                placeholder="Enter credits"
                                min="1"
                                step="1"
                                required
                            />
                        </div>

                        <div className="form-actions">

                            <button
                                type="button"
                                className="cancel-button"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="save-button"
                                disabled={loading}
                            >
                                {loading ? "Saving..." : "Save Course"}
                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>
    );
}

export default CourseFormModal;