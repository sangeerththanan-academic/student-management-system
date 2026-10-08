import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { forgotPassword } from "../services/authService";
import "../styles/login.css";

function ForgotPasswordPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [resetToken, setResetToken] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");
        setResetToken("");

        const normalizedEmail =
            email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError(
                "Email address is required"
            );
            return;
        }

        try {
            setLoading(true);

            const data =
                await forgotPassword(
                    normalizedEmail
                );

            setMessage(data.message);

            /*
             * Development only.
             * Remove before production email integration.
             */
            if (data.resetToken) {
                setResetToken(
                    data.resetToken
                );
            }

        } catch (error) {
            setError(
                error.message ||
                "Unable to process password reset request."
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
                                Forgot Password
                            </h2>

                            <p>
                                Enter your registered
                                email address to reset
                                your password.
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


                        <form
                            className="login-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="form-group">

                                <label htmlFor="email">
                                    Email Address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter your email"
                                    autoComplete="email"
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
                                    ? "Sending..."
                                    : "Send Reset Link"
                                }
                            </button>


                            <button
                                type="button"
                                className="forgot-password-button"
                                onClick={() =>
                                    navigate("/login")
                                }
                                disabled={loading}
                            >
                                Back to Login
                            </button>

                        </form>


                        {resetToken && (
                            <div className="development-reset-token">

                                <p>
                                    Development reset token:
                                </p>

                                <code>
                                    {resetToken}
                                </code>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            `/reset-password?token=${encodeURIComponent(resetToken)}`
                                        )
                                    }
                                >
                                    Continue to Reset Password
                                </button>

                            </div>
                        )}

                    </div>

                </section>

            </div>

        </div>
    );
}

export default ForgotPasswordPage;
