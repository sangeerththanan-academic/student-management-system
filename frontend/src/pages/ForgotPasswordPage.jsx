
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { forgotPassword } from "../services/authService";
import "../styles/login.css";

function ForgotPasswordPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError("Email address is required");
            return;
        }

        try {
            setLoading(true);

            const data = await forgotPassword(normalizedEmail);

            if (!data.success) {
                throw new Error(
                    data.message || "Unable to send a password reset OTP."
                );
            }

            navigate(
                `/reset-password?email=${encodeURIComponent(normalizedEmail)}`
            );
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
                            <span>ACCOUNT RECOVERY</span>

                            <h2>Forgot Password</h2>

                            <p>
                                Enter your registered email address
                                to receive a password reset OTP.
                            </p>
                        </div>

                        {error && (
                            <div className="login-error">
                                {error}
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
                                className="recovery-secondary-button"
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
