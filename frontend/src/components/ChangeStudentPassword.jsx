import { useState, useRef } from "react";
import apiRequest from "../services/api";

function ChangeStudentPassword({ studentId, onPasswordChanged }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({
        type: "",
        message: ""
    });
    const [formErrors, setFormErrors] = useState({});

    // Autofocus ref for password fields (FR-003)
    const currentPasswordInputRef = useRef(null);
    const passwordInputRef = useRef(null);

    // ============================================================
    // CLEAR FIELDS & AUTOFOCUS (FR-003)
    // ============================================================
    const handleClear = () => {
        setCurrentPassword("");
        setPassword("");
        setConfirmPassword("");
        setFormErrors({});
        setNotification({
            type: "",
            message: ""
        });

        // Autofocus password field
        if (passwordInputRef.current) {
            passwordInputRef.current.focus();
        }
    };

    // ============================================================
    // VALIDATE INPUTS
    // ============================================================
    const validate = () => {
        const errors = {};

        // Current password is strictly required
        if (!currentPassword) {
            errors.currentPassword = "Current password is required.";
        }

        if (!password) {
            errors.password = "Password is required.";
        } else if (password.length < 8) {
            errors.password = "Password must contain at least 8 characters.";
        } else if (!/[A-Z]/.test(password)) {
            errors.password = "Password must contain at least one uppercase letter.";
        } else if (!/[a-z]/.test(password)) {
            errors.password = "Password must contain at least one lowercase letter.";
        } else if (!/[0-9]/.test(password)) {
            errors.password = "Password must contain at least one number.";
        } else if (!/[^A-Za-z0-9]/.test(password)) {
            errors.password = "Password must contain at least one special character.";
        }

        if (!confirmPassword) {
            errors.confirmPassword = "Re-enter password is required.";
        } else if (password !== confirmPassword) {
            // FR-001: In password field value must match Re-enter password field
            errors.confirmPassword = "Password and re-enter password must match.";
        }

        return errors;
    };

    // ============================================================
    // FORM SUBMISSION
    // ============================================================
    const handleSubmit = async (event) => {
        event.preventDefault();

        setNotification({
            type: "",
            message: ""
        });

        const errors = validate();
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            const firstErrorMessage =
                errors.currentPassword || errors.password || errors.confirmPassword;
            setNotification({
                type: "error",
                message: firstErrorMessage
            });

            if (errors.currentPassword && currentPasswordInputRef.current) {
                currentPasswordInputRef.current.focus();
            } else if (passwordInputRef.current) {
                passwordInputRef.current.focus();
            }
            return;
        }

        try {
            setLoading(true);

            const payload = {
                currentPassword,
                password,
                confirmPassword,
                reEnterPassword: confirmPassword
            };

            const endpoint = studentId
                ? `/api/students/${studentId}`
                : `/api/students/me`;

            const response = await apiRequest(endpoint, {
                method: "PATCH",
                body: JSON.stringify(payload)
            });

            // FR-004: Display notification message
            setNotification({
                type: "success",
                message: response.message || "Password changed successfully."
            });

            // FR-003: Clearing the password, Re-enter password and autofocus password field
            setCurrentPassword("");
            setPassword("");
            setConfirmPassword("");
            setFormErrors({});

            if (passwordInputRef.current) {
                passwordInputRef.current.focus();
            }

            if (onPasswordChanged) {
                onPasswordChanged();
            }

        } catch (err) {
            console.error("Change password failed:", err);

            setNotification({
                type: "error",
                message: err.message || "Failed to change password."
            });

            if (passwordInputRef.current) {
                passwordInputRef.current.focus();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <section
            className="change-password-card"
            aria-labelledby="change-password-title"
        >
            <div className="change-password-header">
                <div className="change-password-icon-wrapper">
                    <svg
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                </div>
                <div>
                    <h3 id="change-password-title">Change Password</h3>
                    <p>Update your account login password securely</p>
                </div>
            </div>

            {/* Notification messages (FR-004) */}
            {notification.message && (
                <div
                    className={`change-password-alert ${
                        notification.type === "success"
                            ? "alert-success"
                            : "alert-error"
                    }`}
                    role="alert"
                >
                    {notification.type === "success" ? (
                        <svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                            <path d="M22 4L12 14.01l-3-3" />
                        </svg>
                    ) : (
                        <svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    )}
                    <span>{notification.message}</span>
                </div>
            )}

            <form
                className="change-password-form"
                onSubmit={handleSubmit}
                noValidate
            >
                {/* Current Password Field */}
                <div className="change-password-field">
                    <label htmlFor="currentPassword">
                        Current Password <span className="field-required">*</span>
                    </label>
                    <div className="password-input-wrapper">
                        <input
                            ref={currentPasswordInputRef}
                            id="currentPassword"
                            name="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => {
                                setCurrentPassword(e.target.value);
                                if (formErrors.currentPassword) {
                                    setFormErrors((prev) => ({
                                        ...prev,
                                        currentPassword: null
                                    }));
                                }
                            }}
                            placeholder="Enter current password"
                            autoComplete="current-password"
                            disabled={loading}
                            aria-invalid={Boolean(formErrors.currentPassword)}
                            required
                        />
                        <button
                            type="button"
                            className="toggle-password-button"
                            aria-label={
                                showCurrentPassword
                                    ? "Hide current password"
                                    : "Show current password"
                            }
                            onClick={() =>
                                setShowCurrentPassword((prev) => !prev)
                            }
                            disabled={loading}
                        >
                            {showCurrentPassword ? (
                                <svg
                                    viewBox="0 0 24 24"
                                    width="20"
                                    height="20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M3 3l18 18" />
                                    <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                                    <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7a11 11 0 01-3.1 4.2" />
                                    <path d="M6.2 6.2A13 13 0 002.5 12c1 2.5 4.5 7 9.5 7 1.2 0 2.3-.3 3.3-.7" />
                                </svg>
                            ) : (
                                <svg
                                    viewBox="0 0 24 24"
                                    width="20"
                                    height="20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {formErrors.currentPassword && (
                        <span className="form-error">
                            {formErrors.currentPassword}
                        </span>
                    )}
                </div>

                {/* Password Field (FR-001, FR-003) */}
                <div className="change-password-field">
                    <label htmlFor="password">
                        New Password <span className="field-required">*</span>
                    </label>
                    <div className="password-input-wrapper">
                        <input
                            ref={passwordInputRef}
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (formErrors.password) {
                                    setFormErrors((prev) => ({
                                        ...prev,
                                        password: null
                                    }));
                                }
                            }}
                            placeholder="Enter new password"
                            autoComplete="new-password"
                            disabled={loading}
                            aria-invalid={Boolean(formErrors.password)}
                            required
                        />
                        <button
                            type="button"
                            className="toggle-password-button"
                            aria-label={
                                showPassword
                                    ? "Hide new password"
                                    : "Show new password"
                            }
                            onClick={() => setShowPassword((prev) => !prev)}
                            disabled={loading}
                        >
                            {showPassword ? (
                                <svg
                                    viewBox="0 0 24 24"
                                    width="20"
                                    height="20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M3 3l18 18" />
                                    <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                                    <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7a11 11 0 01-3.1 4.2" />
                                    <path d="M6.2 6.2A13 13 0 002.5 12c1 2.5 4.5 7 9.5 7 1.2 0 2.3-.3 3.3-.7" />
                                </svg>
                            ) : (
                                <svg
                                    viewBox="0 0 24 24"
                                    width="20"
                                    height="20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {formErrors.password && (
                        <span className="form-error">
                            {formErrors.password}
                        </span>
                    )}
                    <small className="field-hint">
                        Minimum 8 characters with uppercase, lowercase, number, and special character.
                    </small>
                </div>

                {/* Re-enter Password Field (FR-001, FR-003) */}
                <div className="change-password-field">
                    <label htmlFor="confirmPassword">
                        Re-enter Password <span className="field-required">*</span>
                    </label>
                    <div className="password-input-wrapper">
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (formErrors.confirmPassword) {
                                    setFormErrors((prev) => ({
                                        ...prev,
                                        confirmPassword: null
                                    }));
                                }
                            }}
                            placeholder="Re-enter new password"
                            autoComplete="new-password"
                            disabled={loading}
                            aria-invalid={Boolean(formErrors.confirmPassword)}
                            required
                        />
                        <button
                            type="button"
                            className="toggle-password-button"
                            aria-label={
                                showConfirmPassword
                                    ? "Hide re-entered password"
                                    : "Show re-entered password"
                            }
                            onClick={() =>
                                setShowConfirmPassword((prev) => !prev)
                            }
                            disabled={loading}
                        >
                            {showConfirmPassword ? (
                                <svg
                                    viewBox="0 0 24 24"
                                    width="20"
                                    height="20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M3 3l18 18" />
                                    <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                                    <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7a11 11 0 01-3.1 4.2" />
                                    <path d="M6.2 6.2A13 13 0 002.5 12c1 2.5 4.5 7 9.5 7 1.2 0 2.3-.3 3.3-.7" />
                                </svg>
                            ) : (
                                <svg
                                    viewBox="0 0 24 24"
                                    width="20"
                                    height="20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {formErrors.confirmPassword && (
                        <span className="form-error">
                            {formErrors.confirmPassword}
                        </span>
                    )}
                </div>

                {/* Action Buttons: Change and Clear (FR-003) */}
                <div className="change-password-actions">
                    <button
                        type="submit"
                        className="change-password-submit-btn"
                        disabled={loading}
                    >
                        {loading ? "Changing..." : "Change Password"}
                    </button>

                    <button
                        type="button"
                        className="change-password-clear-btn"
                        onClick={handleClear}
                        disabled={loading}
                    >
                        Clear
                    </button>
                </div>
            </form>
        </section>
    );
}

export default ChangeStudentPassword;
