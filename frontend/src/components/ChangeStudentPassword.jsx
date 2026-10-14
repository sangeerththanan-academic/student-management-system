import { useRef, useState } from "react";

import apiRequest from "../services/api";

function ChangeStudentPassword() {
    const passwordInputRef = useRef(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            passwordInputRef.current?.focus();
            return;
        }

        try {
            setLoading(true);

            const data = await apiRequest(
                "/api/students/me/password",
                {
                    method: "PUT",
                    body: JSON.stringify({ password, confirmPassword })
                }
            );

            setMessage(data.message || "Password changed successfully");
            setPassword("");
            setConfirmPassword("");
            passwordInputRef.current?.focus();
        } catch (requestError) {
            setError(
                requestError.message || "Failed to change your password."
            );
            passwordInputRef.current?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="password-card" aria-labelledby="password-title">
            <h2 id="password-title">Change Password</h2>
            <p className="password-help">
                Use at least 8 characters with uppercase, lowercase, a number,
                and a special character.
            </p>

            {message && (
                <div className="student-success" role="status" aria-live="polite">
                    {message}
                </div>
            )}

            {error && (
                <div className="student-error" role="alert">
                    {error}
                </div>
            )}

            <form className="password-form" onSubmit={handleSubmit}>
                <label htmlFor="student-password">New password</label>
                <input
                    ref={passwordInputRef}
                    id="student-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                    required
                    autoFocus
                />

                <label htmlFor="student-confirm-password">
                    Re-enter password
                </label>
                <input
                    id="student-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Changing password..." : "Change password"}
                </button>
            </form>
        </section>
    );
}

export default ChangeStudentPassword;