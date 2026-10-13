import { useRef, useState } from "react";
import apiRequest from "../services/api";

function ChangeStudentPassword() {
    const currentPasswordRef = useRef(null);

    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const clearForm = () => {
        setFormData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
        });

        setMessage("");
        setMessageType("");

        currentPasswordRef.current?.focus();
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        setMessage("");
        setMessageType("");
    };

    const validateForm = () => {
        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = formData;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return "Please complete all password fields.";
        }

        if (newPassword.length < 8) {
            return "New password must be at least 8 characters.";
        }

        if (!/[A-Z]/.test(newPassword)) {
            return "Include at least one uppercase letter.";
        }

        if (!/[a-z]/.test(newPassword)) {
            return "Include at least one lowercase letter.";
        }

        if (!/\d/.test(newPassword)) {
            return "Include at least one number.";
        }

        if (!/[^A-Za-z0-9]/.test(newPassword)) {
            return "Include at least one special character.";
        }

        if (newPassword !== confirmPassword) {
            return "New password and re-entered password do not match.";
        }

        if (currentPassword === newPassword) {
            return "New password must differ from current password.";
        }

        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const validationError = validateForm();

        if (validationError) {
            setMessage(validationError);
            setMessageType("error");
            return;
        }

        try {
            setLoading(true);
            setMessage("");
            setMessageType("");

            const response = await apiRequest(
                "/api/students/me/password",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                }
            );

            setMessage(
                response.message || "Password changed successfully."
            );
            setMessageType("success");

            setFormData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

            currentPasswordRef.current?.focus();
        } catch (error) {
            setMessage(
                error.message || "Failed to change password."
            );
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="change-password-card">
            <div className="change-password-heading">
                <h2>Change Password</h2>
                <p>
                    Change your account password securely.
                </p>
            </div>

            {message && (
                <div
                    className={`password-notification ${messageType}`}
                    role="status"
                    aria-live="polite"
                >
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
                <div className="password-form-field">
                    <label htmlFor="currentPassword">
                        Current Password
                    </label>

                    <input
                        ref={currentPasswordRef}
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        autoComplete="current-password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        disabled={loading}
                        required
                    />
                </div>

                <div className="password-form-field">
                    <label htmlFor="newPassword">
                        New Password
                    </label>

                    <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        disabled={loading}
                        minLength={8}
                        required
                    />

                    <small>
                        Minimum 8 characters, including uppercase,
                        lowercase, number, and special character.
                    </small>
                </div>

                <div className="password-form-field">
                    <label htmlFor="confirmPassword">
                        Re-enter New Password
                    </label>

                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        required
                    />
                </div>

                <div className="password-form-actions">
                    <button
                        type="submit"
                        className="password-change-button"
                        disabled={loading}
                    >
                        {loading ? "Changing..." : "Change Password"}
                    </button>

                    <button
                        type="button"
                        className="password-clear-button"
                        onClick={clearForm}
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