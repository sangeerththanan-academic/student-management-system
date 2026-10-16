import { useRef, useState } from "react";
import "../styles/changePassword.css";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ChangeStudentPassword() {
    const currentRef = useRef(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // CR-020: Separate show/hide states for each password
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);

    const clearFields = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);

        currentRef.current?.focus();
    };

    const handleClear = () => {
        clearFields();
        setMessage("");
        setMessageType("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setMessageType("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setMessage("Fill all password fields.");
            setMessageType("error");
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage(
                "New password and re-enter password do not match."
            );
            setMessageType("error");
            return;
        }

        const strongPassword =
            newPassword.length >= 8 &&
            /[a-z]/.test(newPassword) &&
            /[A-Z]/.test(newPassword) &&
            /[0-9]/.test(newPassword) &&
            /[^A-Za-z0-9]/.test(newPassword);

        if (!strongPassword) {
            setMessage(
                "Password must be 8+ characters with uppercase, lowercase, number, and special character."
            );
            setMessageType("error");
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            setMessage("Please login again.");
            setMessageType("error");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_BASE_URL}/api/students/me/password`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                        confirmPassword,
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message || "Password change failed."
                );
            }

            clearFields();

            setMessage(
                data.message || "Password changed successfully!"
            );
            setMessageType("success");
        } catch (error) {
            setMessage(error.message || "Something went wrong.");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="change-password-card">
            <h2>Change Password</h2>
            <p>Update your account password securely.</p>

            {message && (
                <div
                    className={`password-message ${messageType}`}
                    role="status"
                    aria-live="polite"
                >
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Current Password */}
                <div className="password-field">
                    <label htmlFor="currentPassword">
                        Current Password
                    </label>

                    <div className="password-input-wrapper">
                        <input
                            ref={currentRef}
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(e) =>
                                setCurrentPassword(e.target.value)
                            }
                            required
                        />

                        <button
                            type="button"
                            className="password-toggle-button"
                            onClick={() =>
                                setShowCurrentPassword((previous) => !previous)
                            }
                            aria-label={
                                showCurrentPassword
                                    ? "Hide current password"
                                    : "Show current password"
                            }
                            aria-pressed={showCurrentPassword}
                        >
                            {showCurrentPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                {/* New Password */}
                <div className="password-field">
                    <label htmlFor="newPassword">
                        New Password
                    </label>

                    <div className="password-input-wrapper">
                        <input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) =>
                                setNewPassword(e.target.value)
                            }
                            required
                        />

                        <button
                            type="button"
                            className="password-toggle-button"
                            onClick={() =>
                                setShowNewPassword((previous) => !previous)
                            }
                            aria-label={
                                showNewPassword
                                    ? "Hide new password"
                                    : "Show new password"
                            }
                            aria-pressed={showNewPassword}
                        >
                            {showNewPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                {/* Confirm New Password */}
                <div className="password-field">
                    <label htmlFor="confirmPassword">
                        Re-enter New Password
                    </label>

                    <div className="password-input-wrapper">
                        <input
                            id="confirmPassword"
                            type={
                                showConfirmPassword ? "text" : "password"
                            }
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            required
                        />

                        <button
                            type="button"
                            className="password-toggle-button"
                            onClick={() =>
                                setShowConfirmPassword(
                                    (previous) => !previous
                                )
                            }
                            aria-label={
                                showConfirmPassword
                                    ? "Hide confirmation password"
                                    : "Show confirmation password"
                            }
                            aria-pressed={showConfirmPassword}
                        >
                            {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="password-actions">
                    <button type="submit" disabled={loading}>
                        {loading ? "Changing..." : "Change Password"}
                    </button>

                    <button
                        type="button"
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
