import { useRef, useState } from "react";
import apiRequest from "../services/api";
import "../styles/changeStudentPassword.css";

function ChangeStudentPassword({ userId }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const passwordRef = useRef(null);

    const clearFields = () => {
        setCurrentPassword("");
        setPassword("");
        setConfirmPassword("");
        setMessage("");
        setMessageType("");
        passwordRef.current?.focus();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setMessageType("");

        if (!userId) {
            setMessage("Your student profile could not be identified. Please reload the page.");
            setMessageType("error");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("New password and re-entered password do not match.");
            setMessageType("error");
            passwordRef.current?.focus();
            return;
        }

        setLoading(true);
        try {
            const data = await apiRequest(`/api/students/${encodeURIComponent(userId)}`, {
                method: "PATCH",
                body: JSON.stringify({
                    currentPassword,
                    password,
                    confirmPassword
                })
            });

            setMessage(data.message || "Password changed successfully.");
            setMessageType("success");
            setCurrentPassword("");
            setPassword("");
            setConfirmPassword("");
            passwordRef.current?.focus();
        } catch (error) {
            setMessage(error.message || "Failed to change password. Please try again.");
            setMessageType("error");
            if (error.status === 401) {
                // The dashboard's existing auth flow handles expired sessions on reload.
                setMessage("Your session has expired. Please log in again.");
            }
            passwordRef.current?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="change-password-card" aria-labelledby="change-password-title">
            <div className="change-password-heading">
                <h2 id="change-password-title">Change Password</h2>
                <p>Update your account password securely.</p>
            </div>

            {message && (
                <div
                    className={`password-notice password-notice-${messageType}`}
                    role={messageType === "error" ? "alert" : "status"}
                    aria-live="polite"
                >
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="change-password-form">
                <div className="password-form-field">
                    <label htmlFor="current-password">Current Password</label>
                    <input
                        id="current-password"
                        name="currentPassword"
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        placeholder="Enter your current password"
                        required
                        disabled={loading}
                    />
                </div>

                <div className="password-form-field">
                    <label htmlFor="new-password">New Password</label>
                    <input
                        ref={passwordRef}
                        id="new-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your new password"
                        minLength={8}
                        required
                        disabled={loading}
                        aria-describedby="new-password-help"
                    />
                    <small id="new-password-help">
                        Use at least 8 characters, including uppercase, lowercase, a number, and a special character.
                    </small>
                </div>

                <div className="password-form-field">
                    <label htmlFor="confirm-password">Re-enter New Password</label>
                    <input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Re-enter your new password"
                        minLength={8}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="change-password-actions">
                    <button type="submit" className="change-password-submit" disabled={loading}>
                        {loading ? "Changing..." : "Change Password"}
                    </button>
                    <button
                        type="button"
                        className="change-password-clear"
                        onClick={clearFields}
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

