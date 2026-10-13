
import { useRef, useState } from "react";
import apiRequest from "../services/api";

function ChangeStudentPassword() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const passwordRef = useRef(null);

    const clearFields = (focusPassword = true) => {
        setCurrentPassword("");
        setPassword("");
        setConfirmPassword("");

        if (focusPassword) {
            requestAnimationFrame(() => {
                passwordRef.current?.focus();
            });
        }
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
            setMessage("Password and re-entered password do not match.");
            setMessageType("error");
            setConfirmPassword("");
            passwordRef.current?.focus();
            return;
        }

        setSubmitting(true);

        try {
            const data = await apiRequest(
                "/api/students/change-password",
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        currentPassword,
                        password,
                        confirmPassword
                    })
                }
            );

            setMessage(data.message || "Password changed successfully.");
            setMessageType("success");
            clearFields();
        } catch (error) {
            setMessage(error.message || "Failed to change password.");
            setMessageType("error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="change-password-card">
            <div className="change-password-heading">
                <h2>Change Password</h2>
                <p>Update your account password securely.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div className="change-password-field">
                    <label htmlFor="currentPassword">
                        Current Password
                    </label>
                    <input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(event) =>
                            setCurrentPassword(event.target.value)
                        }
                        placeholder="Enter current password"
                        required
                    />
                </div>

                <div className="change-password-field">
                    <label htmlFor="newPassword">
                        Password
                    </label>
                    <input
                        ref={passwordRef}
                        id="newPassword"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        placeholder="Enter new password"
                        minLength={8}
                        required
                    />
                    <small>
                        At least 8 characters, including uppercase,
                        lowercase, a number and a special character.
                    </small>
                </div>

                <div className="change-password-field">
                    <label htmlFor="confirmPassword">
                        Re-enter Password
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
                        placeholder="Re-enter new password"
                        minLength={8}
                        required
                    />
                </div>

                {message && (
                    <div
                        className={`password-notification ${messageType}`}
                        role={messageType === "error" ? "alert" : "status"}
                    >
                        {message}
                    </div>
                )}

                <div className="change-password-actions">
                    <button
                        type="submit"
                        className="change-password-submit"
                        disabled={submitting}
                    >
                        {submitting ? "Changing..." : "Change Password"}
                    </button>

                    <button
                        type="button"
                        className="change-password-clear"
                        onClick={handleClear}
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
