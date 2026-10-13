import { useEffect, useRef, useState } from "react";
import apiRequest from "../services/api";

function ChangeStudentPassword() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);

    const currentPasswordRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            currentPasswordRef.current?.focus();
        }
    }, [isOpen]);

    const clearFields = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        currentPasswordRef.current?.focus();
    };

    const closeModal = () => {
        if (loading) return;

        setIsOpen(false);
        clearFields();
        setMessage("");
        setMessageType("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setMessageType("");

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
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
                "Use uppercase, lowercase, a number and a special character."
            );
            setMessageType("error");
            return;
        }

        try {
            setLoading(true);

            const response = await apiRequest(
                "/api/students/change-password",
                {
                    method: "PATCH",
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
        <section className="change-password-section">
            <div className="change-password-intro">
                <div>
                    <h3>Password & Security</h3>
                    <p>
                        Keep your account secure by updating
                        your password.
                    </p>
                </div>

                <button
                    type="button"
                    className="open-password-modal"
                    onClick={() => {
                        setMessage("");
                        setMessageType("");
                        setIsOpen(true);
                    }}
                >
                    Change Password
                </button>
            </div>

            {isOpen && (
                <div
                    className="password-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeModal();
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
                                    Enter your current password
                                    and choose a new one.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="password-modal-close"
                                onClick={closeModal}
                                disabled={loading}
                                aria-label="Close popup"
                            >
                                ×
                            </button>
                        </div>

                        {message && (
                            <div
                                className={`password-message ${messageType}`}
                                role="status"
                                aria-live="polite"
                            >
                                {message}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            className="password-change-form"
                        >
                            <div className="password-field">
                                <label htmlFor="currentPassword">
                                    Old Password
                                </label>

                                <input
                                    ref={currentPasswordRef}
                                    id="currentPassword"
                                    type="password"
                                    autoComplete="current-password"
                                    value={currentPassword}
                                    onChange={(event) =>
                                        setCurrentPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter old password"
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
                                    type="password"
                                    autoComplete="new-password"
                                    value={newPassword}
                                    onChange={(event) =>
                                        setNewPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter new password"
                                    minLength={8}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="password-field">
                                <label htmlFor="confirmPassword">
                                    Re-enter New Password
                                </label>

                                <input
                                    id="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Confirm new password"
                                    minLength={8}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <p className="password-hint">
                                Use at least 8 characters, including
                                uppercase, lowercase, a number and
                                a special character.
                            </p>

                            <div className="password-modal-actions">
                                <button
                                    type="button"
                                    className="password-clear-button"
                                    onClick={() => {
                                        clearFields();
                                        setMessage("");
                                        setMessageType("");
                                    }}
                                    disabled={loading}
                                >
                                    Clear
                                </button>

                                <button
                                    type="button"
                                    className="password-cancel-button"
                                    onClick={closeModal}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="password-submit-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Updating..."
                                        : "Change Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}

export default ChangeStudentPassword;