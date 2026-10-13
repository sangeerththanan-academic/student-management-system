
import { useRef, useState } from "react";
import apiRequest from "../services/api";

function ChangeStudentPassword({ studentId }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const newPasswordRef = useRef(null);

    const clearFields = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setMessage("");
        setMessageType("");

        // Focus the New Password field after clearing.
        requestAnimationFrame(() => {
            newPasswordRef.current?.focus();
        });
    };

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
            setMessage(
                "New Password and Re-enter New Password do not match."
            );
            setMessageType("error");
            return;
        }

        if (newPassword.length < 8) {
            setMessage(
                "New password must contain at least 8 characters."
            );
            setMessageType("error");
            return;
        }

        if (
            !/[A-Z]/.test(newPassword) ||
            !/[a-z]/.test(newPassword) ||
            !/[0-9]/.test(newPassword) ||
            !/[^A-Za-z0-9]/.test(newPassword)
        ) {
            setMessage(
                "Password must include uppercase, lowercase, number and special character."
            );
            setMessageType("error");
            return;
        }

        if (currentPassword === newPassword) {
            setMessage(
                "New password must be different from the current password."
            );
            setMessageType("error");
            return;
        }

        try {
            setSubmitting(true);

            const response = await apiRequest(
                `/api/students/${studentId}/password`,
                {
                    method: "PATCH",
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
                response.message || "Password changed successfully."
            );
            setMessageType("success");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            requestAnimationFrame(() => {
                newPasswordRef.current?.focus();
            });
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
        <section className="change-password-card">
            <div className="change-password-heading">
                <h2>Change Password</h2>
                <p>
                    Verify your current password before creating a new one.
                </p>
            </div>

            {message && (
                <div
                    className={`password-notification ${messageType}`}
                    role={messageType === "error" ? "alert" : "status"}
                    aria-live="polite"
                >
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="password-form-group">
                    <label htmlFor="currentPassword">
                        Current Password
                    </label>

                    <input
                        id="currentPassword"
                        type="password"
                        name="currentPassword"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(event) =>
                            setCurrentPassword(event.target.value)
                        }
                        placeholder="Enter your current password"
                        required
                        disabled={submitting}
                    />
                </div>

                <div className="password-form-group">
                    <label htmlFor="newPassword">
                        New Password
                    </label>

                    <input
                        ref={newPasswordRef}
                        id="newPassword"
                        type="password"
                        name="newPassword"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) =>
                            setNewPassword(event.target.value)
                        }
                        placeholder="Enter your new password"
                        minLength={8}
                        required
                        disabled={submitting}
                    />
                </div>

                <div className="password-form-group">
                    <label htmlFor="confirmPassword">
                        Re-enter New Password
                    </label>

                    <input
                        id="confirmPassword"
                        type="password"
                        name="confirmPassword"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                        placeholder="Re-enter your new password"
                        minLength={8}
                        required
                        disabled={submitting}
                    />
                </div>

                <div className="password-button-group">
                    <button
                        type="submit"
                        className="change-password-button"
                        disabled={submitting}
                    >
                        {submitting
                            ? "Changing Password..."
                            : "Change Password"}
                    </button>

                    <button
                        type="button"
                        className="clear-password-button"
                        onClick={clearFields}
                        disabled={submitting}
                    >
                        Clear
                    </button>
                </div>
            </form>
        </section>
    );
}

export default ChangeStudentPassword;
