
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

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError("Please enter your registered email address.");
            return;
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setLoading(true);

            const data = await forgotPassword(normalizedEmail);

            setMessage(
                data?.message ||
                "An OTP has been sent to your registered email address."
            );

            // Continue to OTP verification and password reset.
            navigate("/reset-password", {
                state: {
                    email: normalizedEmail
                }
            });
        } catch (err) {
            setError(
                err?.message ||
                "Unable to send the OTP. Please try again."
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
                            <span>ACCOUNT RECOVERY</span>

                            <h2>Forgot Password</h2>

                            <p>
                                Enter your registered email address.
                                We will send an OTP if this email is
                                linked to an account.
                            </p>
                        </div>

                        {error && (
                            <div className="login-error" role="alert">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="login-success" role="status">
                                {message}
                            </div>
                        )}

                        <form
                            className="login-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="form-group">
                                <label htmlFor="forgot-email">
                                    Registered Email Address
                                </label>

                                <input
                                    id="forgot-email"
                                    type="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    placeholder="Enter your registered email"
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
                                {loading ? "Sending OTP..." : "Send OTP"}
                            </button>

                            <button
                                type="button"
                                className="forgot-password-button"
                                onClick={() => navigate("/login")}
                                disabled={loading}
                            >
                                Back to Login
                            </button>
                        </form>

                    </div>
                </section>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;
