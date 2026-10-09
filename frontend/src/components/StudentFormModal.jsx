import { useEffect, useState } from "react";

import apiRequest from "../services/api";
import { LuEye, LuEyeClosed } from "react-icons/lu";

function StudentFormModal({
    show,
    editingStudent,
    onClose,
    onSuccess,
    onAuthError
}) {
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        registrationNo: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: ""
    });

    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Reset form when editingStudent changes or modal opens
    useEffect(() => {
        if (!show) return;

        if (editingStudent) {
            setFormData({
                registrationNo: editingStudent.registration_no || "",
                firstName: editingStudent.first_name || "",
                lastName: editingStudent.last_name || "",
                email: editingStudent.email || "",
                phoneNumber: editingStudent.phone_number || "",
                password: ""
            });
        } else {
            setFormData({
                registrationNo: "",
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                password: ""
            });
        }

        setFormError("");
        setFieldErrors({});
        setTouched({});
    }, [editingStudent, show]);


    // ── Validation helpers (CR-004) ─────────────────────────────
    const validateField = (name, value) => {
        const v = (value || "").trim();

        switch (name) {
            case "registrationNo":
                if (!v) return "Registration number is required.";
                if (!/^[A-Za-z0-9_-]+$/.test(v))
                    return "Only letters, numbers, hyphens, or underscores allowed.";
                return null;

            case "firstName":
                if (!v) return "First name is required.";
                if (v.length < 3) return "First name must be at least 3 characters.";
                if (!/^[A-Za-z\s]+$/.test(v)) return "First name must contain letters only.";
                return null;

            case "lastName":
                if (!v) return "Last name is required.";
                if (v.length < 3) return "Last name must be at least 3 characters.";
                if (!/^[A-Za-z\s]+$/.test(v)) return "Last name must contain letters only.";
                return null;

            case "email":
                if (!v) return "Email address is required.";
                if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v))
                    return "Enter a valid email address (e.g. user@example.com).";
                return null;

            case "phoneNumber":
                if (!v) return "Phone number is required.";
                if (!/^\d+$/.test(v)) return "Phone number must contain digits only.";
                if (v.length !== 10) return "Phone number must be exactly 10 digits.";
                return null;

            case "password":
                if (editingStudent) return null;
                if (!value) return "Password is required.";
                if (value.length < 8) return "Password must be at least 8 characters.";
                if (!/[A-Z]/.test(value)) return "Password must include an uppercase letter.";
                if (!/[a-z]/.test(value)) return "Password must include a lowercase letter.";
                if (!/[0-9]/.test(value)) return "Password must include a number.";
                if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(value))
                    return "Password must include a special character.";
                return null;

            default:
                return null;
        }
    };

    const validateAll = () => {
        const fields = ["registrationNo", "firstName", "lastName", "email", "phoneNumber"];
        if (!editingStudent) fields.push("password");

        const errors = {};
        fields.forEach((name) => {
            const err = validateField(name, formData[name]);
            if (err) errors[name] = err;
        });
        return errors;
    };
    // ────────────────────────────────────────────────────────────


    const handleInputChange = (event) => {
        const { name, value } = event.target;

                if (name === "phoneNumber") {

            const digitsOnly =
                value.replace(/\D/g, "");

           
            if (digitsOnly.length <= 10) {

                setFormData((previous) => ({
                    ...previous,
                    phoneNumber: digitsOnly
                }));
            }

            return;
        }

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        // Live-clear the error for the field being edited
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleBlur = (event) => {
        const { name, value } = event.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        const err = validateField(name, value);
        setFieldErrors((prev) => ({ ...prev, [name]: err }));
    };


    const handleClose = () => {
        setFormError("");
        setFieldErrors({});
        setTouched({});
        onClose();
    };

     const validateForm = () => {

        const registrationNo =
            formData.registrationNo.trim();

        const firstName =
            formData.firstName.trim();

        const lastName =
            formData.lastName.trim();

        const email =
            formData.email.trim();

        const phoneNumber =
            formData.phoneNumber.trim();

        const password =
            formData.password;


        

        if (!registrationNo) {

            return "Registration number is required.";
        }




        if (!firstName) {

            return "First name is required.";
        }

        if (firstName.length < 3) {

            return "First name must contain at least 3 characters.";
        }

        if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(firstName)) {

            return "First name must contain only letters.";
        }



        if (!lastName) {

            return "Last name is required.";
        }

        if (lastName.length < 3) {

            return "Last name must contain at least 3 characters.";
        }

        if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(lastName)) {

            return "Last name must contain only letters.";
        }



        if (!email) {

            return "Email address is required.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

            return "Please enter a valid email address.";
        }


        

        if (!phoneNumber) {

            return "Phone number is required.";
        }

        if (!/^\d+$/.test(phoneNumber)) {

            return "Phone number must contain only digits.";
        }

        if (phoneNumber.length !== 10) {

            return "Phone number must contain exactly 10 digits.";
        }


      

        // Password is required only for new student
        if (!editingStudent) {

            if (!password) {

                return "Password is required for a new student.";
            }

            if (password.length < 8) {

                return "Password must be at least 8 characters.";
            }

            if (!/[A-Z]/.test(password)) {

                return "Password must contain at least one uppercase letter.";
            }

            if (!/[a-z]/.test(password)) {

                return "Password must contain at least one lowercase letter.";
            }

            if (!/\d/.test(password)) {

                return "Password must contain at least one number.";
            }

            if (!/[@$!%*?&]/.test(password)) {

                return "Password must contain at least one special character.";
            }
        }


        return null;
    };


    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");

        
        const validationError =
            validateForm();

        if (validationError) {

            setFormError(validationError);

            return;
        }

        try {
            setFormLoading(true);

            if (editingStudent) {
                await apiRequest(
                    `/api/students/${editingStudent.student_id}`,
                    {
                        method: "PUT",
                        body: JSON.stringify({
                            registrationNo: formData.registrationNo.trim(),
                            firstName: formData.firstName.trim(),
                            lastName: formData.lastName.trim(),
                            email: formData.email.trim(),
                            phoneNumber: formData.phoneNumber.trim()
                        })
                    }
                );
            } else {
                await apiRequest(
                    "/api/students/",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            registrationNo: formData.registrationNo.trim(),
                            firstName: formData.firstName.trim(),
                            lastName: formData.lastName.trim(),
                            email: formData.email.trim(),
                            phoneNumber: formData.phoneNumber.trim(),
                            password: formData.password
                        })
                    }
                );
            }

            onSuccess();
            handleClose();

        } catch (error) {
            console.error("Student save error:", error);

            if (error.status === 401) {
                onAuthError();
                return;
            }

            if (error.status === 403) {
                setFormError(
                    "You do not have permission to modify students."
                );
                return;
            }

            setFormError(
                error.message || "Failed to save student."
            );

        } finally {
            setFormLoading(false);
        }
    };
const renderField = (label, name, type = "text", hint = "") => (
    <div
        key={name}
        className={`form-group${
            touched[name] && fieldErrors[name] ? " field-error" : ""
        }`}
    >
        <label htmlFor={`sf-${name}`}>
            {label}
        </label>

        {name === "password" ? (
            <div className="password-input-wrapper">
                <input
                    id={`sf-${name}`}
                    type={showPassword ? "text" : "password"}
                    name={name}
                    value={formData[name]}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={formLoading}
                    autoComplete="new-password"
                    className="password-input"
                    aria-describedby={`sf-${name}-hint`}
                    aria-invalid={!!(
                        touched[name] && fieldErrors[name]
                    )}
                />
<button
    type="button"
    className="password-toggle"
    onClick={() => setShowPassword((prev) => !prev)}
    aria-label={showPassword ? "Hide password" : "Show password"}
    aria-pressed={showPassword}
    disabled={formLoading}
>
    {showPassword ? (
        <LuEyeClosed size={20} aria-hidden="true" />
    ) : (
        <LuEye size={20} aria-hidden="true" />
    )}
</button>
            </div>
        ) : (
            <input
                id={`sf-${name}`}
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleInputChange}
                onBlur={handleBlur}
                disabled={formLoading}
                autoComplete="off"
                aria-describedby={`sf-${name}-hint`}
                aria-invalid={!!(
                    touched[name] && fieldErrors[name]
                )}
            />
        )}

        {touched[name] && fieldErrors[name] ? (
            <span
                id={`sf-${name}-hint`}
                className="field-error-msg"
            >
                {fieldErrors[name]}
            </span>
        ) : hint ? (
            <span
                id={`sf-${name}-hint`}
                className="field-hint"
            >
                {hint}
            </span>
        ) : null}
    </div>
);

    if (!show) return null;




    return (
        <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content student-form-card" onClick={(e) => e.stopPropagation()}>

            <div className="form-card-header">

                <div>
                    <h3>
                        {editingStudent
                            ? "Edit Student"
                            : "Add New Student"
                        }
                    </h3>

                    <p>
                        {editingStudent
                            ? "Update student information."
                            : "Create a new student account."
                        }
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


            {formError && (
                <div className="dashboard-error" role="alert">
                    {formError}
                </div>
            )}


            <form
                className="student-form"
                onSubmit={handleSubmit}
                noValidate
            >

                {renderField(
                    "Registration Number",
                    "registrationNo",
                    "text",
                    "Letters, numbers, hyphens, or underscores only."
                )}

                {renderField(
                    "First Name",
                    "firstName",
                    "text",
                    "Min 3 characters, letters only."
                )}

                {renderField(
                    "Last Name",
                    "lastName",
                    "text",
                    "Min 3 characters, letters only."
                )}

                {renderField(
                    "Email",
                    "email",
                    "email",
                    "e.g. student@example.com"
                )}

                {renderField(
                    "Phone Number",
                    "phoneNumber",
                    "text",
                    "Exactly 10 digits, numbers only."
                )}

                {!editingStudent && renderField(
                    "Password",
                    "password",
                    "password",
                    "Min 8 chars with uppercase, lowercase, number & special character."
                )}


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
                        {formLoading
                            ? "Saving..."
                            : editingStudent
                                ? "Update Student"
                                : "Create Student"
                        }
                    </button>

                </div>

            </form>

        </div>
        </div>
    );
}

export default StudentFormModal;