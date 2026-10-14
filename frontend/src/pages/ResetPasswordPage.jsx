import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { resetPassword } from "../services/authService";
import "../styles/login.css";

function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const initialEmail = searchParams.get("email") || "";
    const legacyToken = searchParams.get("token") || "";

    const [email, setEmail] = useState(initialEmail);
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const validateForm = () => {
        if (!legacyToken && !email.trim()) {
            return "Email address is required.";
        }

        if (!legacyToken && (!otp.trim() || otp.trim().length !== 6)) {
            return "Please enter the complete 6-digit verification code.";
        }

        if (!password || !confirmPassword) {
            return "Please enter and confirm your new password.";
        }

        if (password !== confirmPassword) {
            return "Passwords do not match.";
        }

        if (password.length < 8) {
            return "Password must be at least 8 characters long.";
        }

        if (!/[A-Z]/.test(password)) {
            return "Password must contain at least one uppercase letter.";
        }

        if (!/[a-z]/.test(password)) {
            return "Password must contain at least one lowercase letter.";
        }

        if (!/[0-9]/.test(password)) {
            return "Password must contain at least one number.";
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return "Password must contain at least one special character.";
        }

        return null;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setMessage("");

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);

            let response;
            if (legacyToken) {
                response = await resetPassword(
                    legacyToken,
                    password,
                    confirmPassword
                );
            } else {
                response = await resetPassword({
                    email: email.trim().toLowerCase(),
                    otp: otp.trim(),
                    password,
                    confirmPassword
                });
            }

            setMessage(
                response.message ||
                "Password reset successful! You can now log in with your new password."
            );

            setPassword("");
            setConfirmPassword("");
            setOtp("");

        } catch (err) {
            setError(err.message || "Failed to reset password. Please check your verification code.");
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
                            🔒
                        </div>
                        <h1>Reset Password</h1>
                        <p>
                            Verify the one-time passcode sent to your email and set a new,
                            secure password for your account.
                        </p>
                    </div>
                </aside>

                {/* Form Side */}
                <section className="login-form-section">
                    <div className="login-card">
                        <div className="login-heading">
                            <span>VERIFICATION</span>
                            <h2>Set New Password</h2>
                            <p>
                                {legacyToken
                                    ? "Create a new secure password for your account."
                                    : "Enter the 6-digit OTP from your email and your new password."}
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
                                    <strong>Success</strong>
                                    <p>{message}</p>
                                </div>
                            </div>
                        )}

                        {!message ? (
                            <form className="login-form" onSubmit={handleSubmit}>
                                {!legacyToken && (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="reset-email">Email Address</label>
                                            <input
                                                id="reset-email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your registered email"
                                                autoComplete="email"
                                                disabled={loading}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <div className="form-label-row">
                                                <label htmlFor="reset-otp">One-Time Password (OTP)</label>
                                                <span className="form-sublabel">6-digit code</span>
                                            </div>
                                            <input
                                                id="reset-otp"
                                                className="otp-input"
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength="6"
                                                value={otp}
                                                onChange={(e) =>
                                                    setOtp(e.target.value.replace(/\D/g, ""))
                                                }
                                                placeholder="123456"
                                                autoComplete="one-time-code"
                                                disabled={loading}
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="form-group">
                                    <label htmlFor="new-password">New Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            id="new-password"
                                            className="password-input"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter at least 8 characters"
                                            autoComplete="new-password"
                                            disabled={loading}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-button"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            disabled={loading}
                                        >
                                            {showPassword ? (
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 3l18 18" />
                                                    <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                                                    <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7a11 11 0 01-3.1 4.2" />
                                                    <path d="M6.2 6.2A13 13 0 002.5 12c1 2.5 4.5 7 9.5 7 1.2 0 2.3-.3 3.3-.7" />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirm-new-password">Confirm New Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            id="confirm-new-password"
                                            className="password-input"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter your new password"
                                            autoComplete="new-password"
                                            disabled={loading}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-button"
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                            disabled={loading}
                                        >
                                            {showConfirmPassword ? (
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 3l18 18" />
                                                    <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                                                    <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7a11 11 0 01-3.1 4.2" />
                                                    <path d="M6.2 6.2A13 13 0 002.5 12c1 2.5 4.5 7 9.5 7 1.2 0 2.3-.3 3.3-.7" />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="password-rules-hint">
                                    Must contain 8+ characters, uppercase, lowercase, number, and special character.
                                </div>

                                <button
                                    type="submit"
                                    className="login-submit-button"
                                    disabled={loading}
                                >
                                    {loading ? "Resetting Password..." : "Reset Password"}
                                </button>

                                <button
                                    type="button"
                                    className="forgot-password-button"
                                    onClick={() => navigate("/login")}
                                    disabled={loading}
                                >
                                    Cancel & Back to Login
                                </button>
                            </form>
                        ) : (
                            <div className="reset-success-actions">
                                <button
                                    type="button"
                                    className="login-submit-button"
                                    onClick={() => navigate("/login")}
                                >
                                    Sign In with New Password &rarr;
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default ResetPasswordPage;
