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
    const [sentEmail, setSentEmail] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError("Email address is required.");
            return;
        }

        const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailPattern.test(normalizedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setLoading(true);

            const data = await forgotPassword(normalizedEmail);

            setSentEmail(normalizedEmail);
            setMessage(
                data.message ||
                "If an account exists for this email address, a 6-digit verification code (OTP) has been sent."
            );

        } catch (err) {
            setError(
                err.message ||
                "Unable to process password reset request. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                {/* Information Branding Side */}
                <aside className="login-info">
                    <button
                        type="button"
                        className="back-button"
                        onClick={() => navigate("/login")}
                    >
                        &larr; Back to Login
                    </button>

                    <div className="login-info-content">
                        <div className="login-logo" aria-hidden="true">
                            🎓
                        </div>
                        <h1>Account Recovery</h1>
                        <p>
                            Secure password recovery powered by Google App Password SMTP
                            verification. Protect your student account with multi-layered verification.
                        </p>
                    </div>
                </aside>

                {/* Form Side */}
                <section className="login-form-section">
                    <div className="login-card">
                        <div className="login-heading">
                            <span>RECOVERY</span>
                            <h2>Forgot Password</h2>
                            <p>
                                Enter your registered email to receive a 6-digit One-Time Password (OTP).
                            </p>
                        </div>

                        {error && (
                            <div className="login-error" role="alert">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="login-success" role="status">
                                <div className="success-icon" aria-hidden="true">✓</div>
                                <div className="success-body">
                                    <strong>Code Dispatched</strong>
                                    <p>{message}</p>
                                </div>
                            </div>
                        )}

                        {!sentEmail ? (
                            <form className="login-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder="e.g. student@example.com"
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
                                    {loading ? "Sending OTP..." : "Send Verification Code"}
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
                        ) : (
                            <div className="otp-dispatched-actions">
                                <p className="otp-instructions">
                                    Please check your inbox (and spam folder) for the 6-digit code.
                                    The code expires in <strong>10 minutes</strong>.
                                </p>

                                <button
                                    type="button"
                                    className="login-submit-button"
                                    onClick={() =>
                                        navigate(
                                            `/reset-password?email=${encodeURIComponent(sentEmail)}`
                                        )
                                    }
                                >
                                    Proceed to Enter OTP &rarr;
                                </button>

                                <button
                                    type="button"
                                    className="forgot-password-button"
                                    onClick={() => {
                                        setSentEmail("");
                                        setMessage("");
                                    }}
                                >
                                    Try another email
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
