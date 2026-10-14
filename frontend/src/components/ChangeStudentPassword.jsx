import { useState } from "react";
import apiRequest from "../services/api";

// CR-020: Change Student Password Component
function ChangeStudentPassword() {
    const [password, setPassword]             = useState("");
    const [rePassword, setRePassword]         = useState("");
    const [message, setMessage]               = useState(null);   // { type: "success"|"error", text }
    const [loading, setLoading]               = useState(false);

    // FR-003: Clear fields and autofocus on reset
    const resetForm = () => {
        setPassword("");
        setRePassword("");
        // Autofocus the password field after clearing
        setTimeout(() => {
            const el = document.getElementById("cp-password");
            if (el) el.focus();
        }, 50);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        // FR-001: Password must match Re-enter password
        if (password !== rePassword) {
            setMessage({ type: "error", text: "Passwords do not match. Please re-enter." });
            return;
        }

        if (password.trim() === "") {
            setMessage({ type: "error", text: "Password cannot be empty." });
            return;
        }

        try {
            setLoading(true);

            // FR-002 / SEC-002: Backend hashes the new password before storing
            await apiRequest("/api/students/me/change-password", {
                method: "PUT",
                body: JSON.stringify({ password })
            });

            // FR-004: Display success notification
            setMessage({ type: "success", text: "Password changed successfully." });

            // FR-003: Clear fields and autofocus after success
            resetForm();

        } catch (err) {
            // FR-004: Display error notification
            setMessage({
                type: "error",
                text: err.message || "Failed to change password. Please try again."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password-card">

            <h2 className="section-title">Change Password</h2>

            {/* FR-004: Notification message */}
            {message && (
                <div
                    className={`cp-notification ${message.type === "success" ? "cp-success" : "cp-error"}`}
                    role="alert"
                    aria-live="polite"
                >
                    {message.text}
                </div>
            )}

            <form
                id="change-password-form"
                className="change-password-form"
                onSubmit={handleSubmit}
                noValidate
            >

                {/* FR-001: Password field */}
                <div className="cp-field-group">
                    <label htmlFor="cp-password" className="cp-label">
                        New Password
                    </label>
                    <input
                        id="cp-password"
                        type="password"
                        className="cp-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        disabled={loading}
                        required
                    />
                </div>

                {/* FR-001: Re-enter password field */}
                <div className="cp-field-group">
                    <label htmlFor="cp-re-password" className="cp-label">
                        Re-enter Password
                    </label>
                    <input
                        id="cp-re-password"
                        type="password"
                        className="cp-input"
                        value={rePassword}
                        onChange={(e) => setRePassword(e.target.value)}
                        placeholder="Re-enter new password"
                        autoComplete="new-password"
                        disabled={loading}
                        required
                    />
                </div>

                <div className="cp-actions">
                    <button
                        type="submit"
                        id="cp-submit-btn"
                        className="cp-btn cp-btn-primary"
                        disabled={loading}
                    >
                        {loading ? "Changing…" : "Change Password"}
                    </button>

                    {/* FR-003: Clear fields button */}
                    <button
                        type="button"
                        id="cp-clear-btn"
                        className="cp-btn cp-btn-secondary"
                        onClick={() => {
                            setMessage(null);
                            resetForm();
                        }}
                        disabled={loading}
                    >
                        Clear
                    </button>
                </div>

            </form>
        </div>
    );
}

export default ChangeStudentPassword;
