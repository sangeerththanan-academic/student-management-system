import { useEffect, useRef, useState } from "react";
import apiRequest from "../services/api";

function ChangeStudentPassword({ onClose }) {
    const oldPasswordRef = useRef(null);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        oldPasswordRef.current?.focus();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");

        if (newPassword !== confirmPassword) {
            setIsError(true);
            setMessage("New password and confirm password do not match.");
            return;
        }

        setSubmitting(true);

        try {
            const data = await apiRequest(
                "/api/students/change-password",
                {
                    method: "PUT",
                    body: JSON.stringify({
                        oldPassword,
                        newPassword,
                        confirmPassword
                    })
                }
            );

            setIsError(false);
            setMessage(data.message || "Password changed successfully.");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            oldPasswordRef.current?.focus();
        } catch (error) {
            setIsError(true);
            setMessage(error.message || "Failed to change password.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="change-password-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !submitting) {
                    onClose();
                }
            }}
        >
            <section
                className="change-password-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="change-password-title"
            >
                <div className="change-password-heading">
                    <h2 id="change-password-title">Change Password</h2>
                    <button
                        type="button"
                        className="change-password-close"
                        onClick={onClose}
                        aria-label="Close"
                        disabled={submitting}
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="change-password-field">
                        <label htmlFor="oldPassword">Old Password</label>
                        <input
                            ref={oldPasswordRef}
                            id="oldPassword"
                            type="password"
                            autoComplete="current-password"
                            value={oldPassword}
                            onChange={(event) => setOldPassword(event.target.value)}
                            required
                            disabled={submitting}
                        />
                    </div>

                    <div className="change-password-field">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            id="newPassword"
                            type="password"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            minLength={8}
                            required
                            disabled={submitting}
                        />
                    </div>

                    <div className="change-password-field">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            minLength={8}
                            required
                            disabled={submitting}
                        />
                    </div>

                    {message && (
                        <p
                            className={`change-password-message ${isError ? "error" : "success"}`}
                            role="status"
                        >
                            {message}
                        </p>
                    )}

                    <div className="change-password-actions">
                        <button
                            type="button"
                            className="change-password-cancel"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="change-password-submit"
                            disabled={submitting}
                        >
                            {submitting ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default ChangeStudentPassword;
