import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { forgotPassword } from "../services/authService";
import "../styles/login.css";
import "../styles/passwordRecovery.css";

function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [requestSubmitted, setRequestSubmitted] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        const normalizedEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setLoading(true);
            const result = await forgotPassword(normalizedEmail);
            setMessage(
                result.message ||
                "If an account exists for this email address, an OTP has been sent."
            );
            setEmail(normalizedEmail);
            setRequestSubmitted(true);
        } catch (requestError) {
            setError(
                requestError.message ||
                "Unable to process your request. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page recovery-page">
            <div className="login-theme-toggle">
                <ThemeToggle />
            </div>

            <div className="recovery-card login-card">
                <div className="login-heading">
                    <span>ACCOUNT RECOVERY</span>
                    <h2>Forgot Password?</h2>
                    <p>
                        Enter your registered email address. If it belongs to an
                        account, we will send a one-time password (OTP).
                    </p>
                </div>

                {error && <div className="login-error" role="alert">{error}</div>}
                {message && <div className="recovery-success" role="status">{message}</div>}

                {!requestSubmitted ? (
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="recovery-email">Registered email address</label>
                            <input
                                id="recovery-email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="Enter your registered email"
                                disabled={loading}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="login-submit-button"
                            disabled={loading}
                        >
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                    </form>
                ) : (
                    <button
                        type="button"
                        className="login-submit-button"
                        onClick={() => navigate("/reset-password", { state: { email } })}
                    >
                        Enter OTP and Reset Password
                    </button>
                )}

                <button
                    type="button"
                    className="recovery-secondary-button"
                    onClick={() => navigate("/login")}
                >
                    Back to Login
                </button>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;