
import { useRef, useState } from "react";
import apiRequest from "../services/api";

function ChangeStudentPassword() {
    const currentPasswordRef = useRef(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setMessageType("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setMessage("Please fill in all password fields.");
            setMessageType("error");
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage("New passwords do not match.");
            setMessageType("error");
            return;
        }

        if (newPassword.length < 8) {
            setMessage("New password must be at least 8 characters.");
            setMessageType("error");
            return;
        }

        if (
            !/[A-Z]/.test(newPassword) ||
            !/[a-z]/.test(newPassword) ||
            !/[0-9]/.test(newPassword) ||
            !/[@$!%*?&]/.test(newPassword)
        ) {
            setMessage(
                "Password must include uppercase, lowercase, a number and a special character (@$!%*?&)."
            );
            setMessageType("error");
            return;
        }

        if (currentPassword === newPassword) {
            setMessage(
                "New password must be different from your current password."
            );
            setMessageType("error");
            return;
        }

        setLoading(true);

        try {
            const data = await apiRequest(
                "/api/students/me/password",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                        confirmPassword
                    })
                }
            );

            setMessage(
                data.message || "Password changed successfully."
            );
            setMessageType("success");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

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
            <h2 className="section-title">Change Password</h2>

            <p className="change-password-description">
                Enter your current password and choose a new password.
            </p>

            {message && (
                <div
                    className={
                        messageType === "success"
                            ? "password-notice password-notice-success"
                            : "password-notice password-notice-error"
                    }
                    role="status"
                    aria-live="polite"
                >
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="password-form-field">
                    <label htmlFor="current-student-password">
                        Current Password
                    </label>

                    <input
                        ref={currentPasswordRef}
                        id="current-student-password"
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(event) =>
                            setCurrentPassword(event.target.value)
                        }
                        placeholder="Enter current password"
                        required
                        disabled={loading}
                    />
                </div>

                <div className="password-form-field">
                    <label htmlFor="new-student-password">
                        New Password
                    </label>

                    <input
                        id="new-student-password"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) =>
                            setNewPassword(event.target.value)
                        }
                        placeholder="Enter new password"
                        required
                        minLength={8}
                        disabled={loading}
                    />
                </div>

                <div className="password-form-field">
                    <label htmlFor="confirm-student-password">
                        Confirm New Password
                    </label>

                    <input
                        id="confirm-student-password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                        placeholder="Re-enter new password"
                        required
                        minLength={8}
                        disabled={loading}
                    />
                </div>

                <p className="password-hint">
                    Use at least 8 characters, including uppercase,
                    lowercase, a number and a special character.
                </p>

                <button
                    type="submit"
                    className="change-password-button"
                    disabled={loading}
                >
                    {loading ? "Changing Password..." : "Change Password"}
                </button>
            </form>
        </section>
    );
}

export default ChangeStudentPassword;
