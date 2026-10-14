
import { useRef, useState } from "react";
import apiRequest from "../services/api";

function ChangeStudentPassword({ onAuthError }) {
    const oldPasswordRef = useRef(null);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const clearPasswords = () => {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");

        requestAnimationFrame(() => {
            oldPasswordRef.current?.focus();
        });
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

        if (newPassword.length < 8) {
            setMessage(
                "New password must be at least 8 characters."
            );
            setMessageType("error");
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage(
                "New password and re-entered password do not match."
            );
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

        try {
            setLoading(true);

            const data = await apiRequest(
                "/api/students/change-password",
                {
                    method: "POST",
                    body: JSON.stringify({
                        oldPassword,
                        newPassword,
                        confirmPassword
                    })
                }
            );

            setMessage(
                data.message || "Password changed successfully."
            );
            setMessageType("success");

            clearPasswords();
        } catch (error) {
            if (error.status === 401) {
                if (onAuthError) {
                    onAuthError();
                    return;
                }
            }

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
            <div className="change-password-header">
                <h2>Change Password</h2>
                <p>
                    Verify your current password before setting
                    a new one.
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

            <form
                className="change-password-form"
                onSubmit={handleSubmit}
            >
                <div className="password-field">
                    <label htmlFor="oldPassword">
                        Old Password
                    </label>

                    <input
                        ref={oldPasswordRef}
                        id="oldPassword"
                        name="oldPassword"
                        type="password"
                        autoComplete="current-password"
                        value={oldPassword}
                        onChange={(event) =>
                            setOldPassword(event.target.value)
                        }
                        placeholder="Enter your current password"
                        required
                        disabled={loading}
                    />
                </div>

                <div className="password-field">
                    <label htmlFor="newPassword">
                        New Password
                    </label>

                    <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) =>
                            setNewPassword(event.target.value)
                        }
                        placeholder="Enter your new password"
                        minLength={8}
                        required
                        disabled={loading}
                    />

                    <small>
                        Must contain at least 8 characters.
                    </small>
                </div>

                <div className="password-field">
                    <label htmlFor="confirmPassword">
                        Re-enter New Password
                    </label>

                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                        placeholder="Re-enter your new password"
                        minLength={8}
                        required
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    className="change-password-button"
                    disabled={loading}
                >
                    {loading
                        ? "Changing Password..."
                        : "Change Password"}
                </button>
            </form>
        </section>
    );
}

export default ChangeStudentPassword;
