import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { resetPassword } from "../services/authService";
import "../styles/login.css";
import "../styles/passwordRecovery.css";

function ResetPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState(location.state?.email || "");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        const normalizedEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!/^\d{6}$/.test(otp.trim())) {
            setError("Enter the 6-digit OTP sent to your email.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);
            const result = await resetPassword(
                normalizedEmail,
                otp.trim(),
                password,
                confirmPassword
            );

            setSuccess(result.message || "Password reset successful.");
            setOtp("");
            setPassword("");
            setConfirmPassword("");
        } catch (requestError) {
            setError(
                requestError.message ||
                "Invalid or expired OTP. Request a new OTP and try again."
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
                    <h2>Reset Password</h2>
                    <p>
                        Enter the OTP sent to your registered email and choose
                        a new password. The OTP expires after 10 minutes.
                    </p>
                </div>

                {error && <div className="login-error" role="alert">{error}</div>}
                {success && <div className="recovery-success" role="status">{success}</div>}

                {!success ? (
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="reset-email">Registered email address</label>
                            <input
                                id="reset-email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="Enter your registered email"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reset-otp">6-digit email OTP</label>
                            <input
                                id="reset-otp"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                value={otp}
                                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="Enter OTP"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="new-password">New password</label>
                            <input
                                id="new-password"
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="At least 8 characters"
                                disabled={loading}
                                minLength={8}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirm-password">Confirm new password</label>
                            <input
                                id="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                placeholder="Re-enter your new password"
                                disabled={loading}
                                minLength={8}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="login-submit-button"
                            disabled={loading}
                        >
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                ) : (
                    <button
                        type="button"
                        className="login-submit-button"
                        onClick={() => navigate("/login", { replace: true })}
                    >
                        Back to Login
                    </button>
                )}

                {!success && (
                    <button
                        type="button"
                        className="recovery-secondary-button"
                        onClick={() => navigate("/forgot-password")}
                    >
                        Request a new OTP
                    </button>
                )}
            </div>
        </div>
    );
}

export default ResetPasswordPage;