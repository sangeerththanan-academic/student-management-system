import { useRef, useState } from "react";
import apiRequest from "../services/api";

function ChangeStudentPassword() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);
    const currentPasswordRef = useRef(null);

    const clearFields = () => {
        setCurrentPassword("");
        setPassword("");
        setConfirmPassword("");
        currentPasswordRef.current?.focus();
    };

    const handleClear = () => {
        clearFields();
        setMessage("");
        setMessageType("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setMessageType("");

        if (!currentPassword || !password || !confirmPassword) {
            setMessage("Please complete all password fields.");
            setMessageType("error");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("New password and re-enter password do not match.");
            setMessageType("error");
            return;
        }

        if (password.length < 8 || !/[A-Z]/.test(password) ||
            !/[a-z]/.test(password) || !/[0-9]/.test(password) ||
            !/[^A-Za-z0-9]/.test(password)) {
            setMessage("Use at least 8 characters, including uppercase, lowercase, a number and a special character.");
            setMessageType("error");
            return;
        }

        setLoading(true);
        try {
            const result = await apiRequest("/api/students/me/password", {
                method: "PATCH",
                body: JSON.stringify({ currentPassword, password, confirmPassword })
            });
            setMessage(result.message || "Password changed successfully.");
            setMessageType("success");
            clearFields();
        } catch (error) {
            setMessage(error.message || "Unable to change password.");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="change-password-card" aria-labelledby="change-password-title">
            <div className="change-password-heading">
                <div>
                    <h2 id="change-password-title">Change Password</h2>
                    <p>Keep your student account secure by updating your password.</p>
                </div>
            </div>

            {message && (
                <div className={`password-notice ${messageType}`} role="status" aria-live="polite">
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="change-password-form">
                <div className="password-field-group">
                    <label htmlFor="current-password">Current Password</label>
                    <input
                        ref={currentPasswordRef}
                        id="current-password"
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        required
                    />
                </div>

                <div className="password-field-group">
                    <label htmlFor="new-password">New Password</label>
                    <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        minLength={8}
                        required
                    />
                    <small>At least 8 characters with uppercase, lowercase, number and special character.</small>
                </div>

                <div className="password-field-group">
                    <label htmlFor="confirm-password">Re-enter Password</label>
                    <input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        minLength={8}
                        required
                    />
                </div>

                <div className="change-password-actions">
                    <button type="submit" className="change-password-button" disabled={loading}>
                        {loading ? "Changing..." : "Change Password"}
                    </button>
                    <button type="button" className="clear-password-button" onClick={handleClear} disabled={loading}>
                        Clear
                    </button>
                </div>
            </form>
        </section>
    );
}

export default ChangeStudentPassword;
