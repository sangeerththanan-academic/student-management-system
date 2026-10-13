
import { useRef, useState } from "react";
import apiRequest from "../services/api";
import "../styles/studentDashboard.css";

function StudentChangePassword({ onClose }) {
    const oldPasswordRef = useRef(null);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Password visibility states
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const clearFields = () => {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setMessage("");
        setMessageType("");

        setShowOldPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);

        oldPasswordRef.current?.focus();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setMessageType("");

        if (!oldPassword || !newPassword || !confirmPassword) {
            setMessage("Please fill in all password fields.");
            setMessageType("error");
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage("New passwords do not match.");
            setMessageType("error");
            return;
        }

        if (oldPassword === newPassword) {
            setMessage(
                "New password must be different from the old password."
            );
            setMessageType("error");
            return;
        }

        setSubmitting(true);

        try {
            const data = await apiRequest(
                "/api/students/change-password",
                {
                    method: "POST",
                    body: JSON.stringify({
                        oldPassword,
                        newPassword,
                        confirmPassword,
                    }),
                }
            );

            setMessage(
                data.message || "Password changed successfully."
            );
            setMessageType("success");

            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setShowOldPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);

            oldPasswordRef.current?.focus();
        } catch (error) {
            setMessage(
                error.message || "Failed to change password."
            );
            setMessageType("error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="password-modal-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="password-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="password-modal-title"
            >
                <div className="password-modal-header">
                    <div>
                        <h2 id="password-modal-title">
                            Change Password
                        </h2>

                        <p>
                            Enter your current password to continue.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="password-close-button"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {message && (
                    <div
                        className={`password-message ${messageType}`}
                        role="status"
                    >
                        {message}
                    </div>
                )}

                <form
                    className="password-form"
                    onSubmit={handleSubmit}
                >
                    {/* Old Password */}
                    <div className="password-form-group">
                        <label htmlFor="oldPassword">
                            Old Password
                        </label>

                        <div className="password-input-wrapper">
                            <input
                                ref={oldPasswordRef}
                                id="oldPassword"
                                type={showOldPassword ? "text" : "password"}
                                autoComplete="current-password"
                                value={oldPassword}
                                onChange={(event) =>
                                    setOldPassword(event.target.value)
                                }
                                placeholder="Enter old password"
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle-button"
                                onClick={() =>
                                    setShowOldPassword((previous) => !previous)
                                }
                                aria-label={
                                    showOldPassword
                                        ? "Hide old password"
                                        : "Show old password"
                                }
                            >
                                {showOldPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="password-form-group">
                        <label htmlFor="newPassword">
                            New Password
                        </label>

                        <div className="password-input-wrapper">
                            <input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(event) =>
                                    setNewPassword(event.target.value)
                                }
                                placeholder="Enter new password"
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
                            >
                                {showNewPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="password-form-group">
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
                                onChange={(event) =>
                                    setConfirmPassword(event.target.value)
                                }
                                placeholder="Confirm new password"
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
                                        ? "Hide confirm password"
                                        : "Show confirm password"
                                }
                            >
                                {showConfirmPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <div className="password-form-actions">
                        <button
                            type="button"
                            className="password-clear-button"
                            onClick={clearFields}
                            disabled={submitting}
                        >
                            Clear
                        </button>

                        <button
                            type="submit"
                            className="password-submit-button"
                            disabled={submitting}
                        >
                            {submitting
                                ? "Changing..."
                                : "Change Password"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default StudentChangePassword;
