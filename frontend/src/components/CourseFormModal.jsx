import { useState } from 'react';
import { createCourse } from '../services/courseService';
import './dashboard-sidebar.css';

const empty = { course_code: '', course_name: '', description: '', credits: '' };

export default function CourseFormModal({ onClose, onCreated }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.course_code.trim()) e.course_code = 'Course code is required';
    else if (form.course_code.trim().length > 20) e.course_code = 'Max 20 characters';
    if (!form.course_name.trim()) e.course_name = 'Course name is required';
    else if (form.course_name.trim().length > 150) e.course_name = 'Max 150 characters';
    if (form.description.length > 1000) e.description = 'Max 1000 characters';
    const c = Number(form.credits);
    if (form.credits === '') e.credits = 'Credits is required';
    else if (!Number.isInteger(c) || c < 1 || c > 10) e.credits = 'Enter a whole number between 1 and 10';
    return e;
  };

  const handleChange = (ev) => {
    setForm({ ...form, [ev.target.name]: ev.target.value });
    setErrors({ ...errors, [ev.target.name]: undefined });
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return; // invalid input is not submitted

    setSubmitting(true);
    try {
      const created = await createCourse({
        course_code: form.course_code.trim(),
        course_name: form.course_name.trim(),
        description: form.description.trim(),
        credits: Number(form.credits),
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setErrors({ ...err.data?.errors, submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3>Add Course</h3>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="course_code">Course Code</label>
            <input id="course_code" name="course_code" value={form.course_code} onChange={handleChange} placeholder="e.g. ICT101" />
            {errors.course_code && <div className="error-text">{errors.course_code}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="course_name">Course Name</label>
            <input id="course_name" name="course_name" value={form.course_name} onChange={handleChange} placeholder="e.g. Introduction to Programming" />
            {errors.course_name && <div className="error-text">{errors.course_name}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows="3" value={form.description} onChange={handleChange} />
            {errors.description && <div className="error-text">{errors.description}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="credits">Credits</label>
            <input id="credits" name="credits" type="number" min="1" max="10" value={form.credits} onChange={handleChange} />
            {errors.credits && <div className="error-text">{errors.credits}</div>}
          </div>
          {errors.submit && <div className="error-text">{errors.submit}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Course'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
