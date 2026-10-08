import { useState } from "react";
import {
    useNavigate,
    useSearchParams
} from "react-router-dom";

import { resetPassword } from "../services/authService";
import "../styles/login.css";

function ResetPasswordPage() {
    const navigate = useNavigate();

    const [searchParams] =
        useSearchParams();

    const token =
        searchParams.get("token") || "";

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setMessage("");

        if (!token) {
            setError(
                "Invalid or missing password reset token."
            );
            return;
        }

        if (!password || !confirmPassword) {
            setError(
                "Please enter and confirm your new password."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError(
                "Passwords do not match."
            );
            return;
        }

        if (password.length < 8) {
            setError(
                "Password must be at least 8 characters long."
            );
            return;
        }

        try {
            setLoading(true);

            const data =
                await resetPassword(
                    token,
                    password,
                    confirmPassword
                );

            setMessage(data.message);

            setPassword("");
            setConfirmPassword("");

        } catch (error) {
            setError(
                error.message ||
                "Unable to reset password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <div className="login-container">

                <section className="login-form-section">

                    <div className="login-card">

                        <div className="login-heading">

                            <span>
                                ACCOUNT RECOVERY
                            </span>

                            <h2>
                                Reset Password
                            </h2>

                            <p>
                                Create a new password
                                for your account.
                            </p>

                        </div>


                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}


                        {message && (
                            <div className="login-success">
                                {message}
                            </div>
                        )}


                        {!message && (
                            <form
                                className="login-form"
                                onSubmit={handleSubmit}
                            >

                                <div className="form-group">

                                    <label htmlFor="password">
                                        New Password
                                    </label>

                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Enter new password"
                                        autoComplete="new-password"
                                        disabled={loading}
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label htmlFor="confirmPassword">
                                        Confirm New Password
                                    </label>

                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(event) =>
                                            setConfirmPassword(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Confirm new password"
                                        autoComplete="new-password"
                                        disabled={loading}
                                        required
                                    />

                                </div>


                                <button
                                    type="submit"
                                    className="login-submit-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Resetting..."
                                        : "Reset Password"
                                    }
                                </button>

                            </form>
                        )}


                        {message && (
                            <button
                                type="button"
                                className="forgot-password-button"
                                onClick={() =>
                                    navigate("/login")
                                }
                            >
                                Back to Login
                            </button>
                        )}

                    </div>

                </section>

            </div>

        </div>
    );
}

export default ResetPasswordPage;
