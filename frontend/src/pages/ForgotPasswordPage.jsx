import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordOTP } from "../services/authService";
import "../styles/passwordRecovery.css";

function ForgotPasswordPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setMessage("");

        const normalizedEmail = email.trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setLoading(true);

            await requestPasswordOTP(normalizedEmail);
            console.log('mail....');


            // Do not reveal whether the email is registered.
            navigate("/verify-otp", {
                state: { email: normalizedEmail }
            });
        } catch (err) {
            setMessage(
                err.message ||
                "If the account is eligible, recovery instructions will be sent."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="recovery-page">
            <section className="recovery-card">
                <div className="recovery-icon">✉</div>

                <h1>Forgot Password?</h1>

                <p>
                    Enter your registered email address to receive
                    a one-time password (OTP).
                </p>

                {error && (
                    <div className="recovery-error" role="alert">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="recovery-message" role="status">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label htmlFor="recovery-email">
                        Email Address
                    </label>

                    <input
                        id="recovery-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Sending OTP..." : "Send OTP"}
                    </button>
                </form>

                <Link className="recovery-back-link" to="/login">
                    Back to Login
                </Link>
            </section>
        </main>
    );
}

export default ForgotPasswordPage;