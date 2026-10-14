
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { resetPassword } from "../services/authService";
import "../styles/login.css";

function ResetPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Email can be passed from ForgotPasswordPage
    // through React Router navigation state.
    const [email, setEmail] = useState(
        location.state?.email || ""
    );

    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setMessage("");

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedOtp = otp.trim();

        if (!normalizedEmail) {
            setError("Please enter your registered email address.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!/^\d{6}$/.test(normalizedOtp)) {
            setError("Please enter the valid 6-digit OTP sent to your email.");
            return;
        }

        if (!password || !confirmPassword) {
            setError("Please enter and confirm your new password.");
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

            const data = await resetPassword(
                normalizedEmail,
                normalizedOtp,
                password,
                confirmPassword
            );

            setMessage(
                data?.message ||
                "Your password has been reset successfully."
            );

            setOtp("");
            setPassword("");
            setConfirmPassword("");

        } catch (err) {
            setError(
                err?.message ||
                "Unable to reset password. Please check your OTP and try again."
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

                            <h2>Reset Password</h2>

                            <p>
                                Verify your email OTP and create
                                a new password for your account.
                            </p>
                        </div>

                        {error && (
                            <div className="login-error" role="alert">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div
                                className="login-success"
                                role="status"
                            >
                                {message}
                            </div>
                        )}

                        {!message && (
                            <form
                                className="login-form"
                                onSubmit={handleSubmit}
                            >
                                <div className="form-group">
                                    <label htmlFor="reset-email">
                                        Registered Email Address
                                    </label>

                                    <input
                                        id="reset-email"
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

                                <div className="form-group">
                                    <label htmlFor="reset-otp">
                                        Email OTP
                                    </label>

                                    <input
                                        id="reset-otp"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        value={otp}
                                        onChange={(event) =>
                                            setOtp(
                                                event.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 6)
                                            )
                                        }
                                        placeholder="Enter 6-digit OTP"
                                        maxLength={6}
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="new-password">
                                        New Password
                                    </label>

                                    <div className="password-input-wrapper">
                                        <input
                                            id="new-password"
                                            className="password-input"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(event.target.value)
                                            }
                                            placeholder="Enter new password"
                                            autoComplete="new-password"
                                            minLength={8}
                                            disabled={loading}
                                            required
                                        />

                                        <button
                                            type="button"
                                            className="password-toggle-button"
                                            onClick={() =>
                                                setShowPassword((value) => !value)
                                            }
                                            aria-label={
                                                showPassword
                                                    ? "Hide new password"
                                                    : "Show new password"
                                            }
                                            disabled={loading}
                                        >
                                            {showPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirm-password">
                                        Confirm New Password
                                    </label>

                                    <div className="password-input-wrapper">
                                        <input
                                            id="confirm-password"
                                            className="password-input"
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={confirmPassword}
                                            onChange={(event) =>
                                                setConfirmPassword(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Confirm new password"
                                            autoComplete="new-password"
                                            minLength={8}
                                            disabled={loading}
                                            required
                                        />

                                        <button
                                            type="button"
                                            className="password-toggle-button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    (value) => !value
                                                )
                                            }
                                            aria-label={
                                                showConfirmPassword
                                                    ? "Hide confirm password"
                                                    : "Show confirm password"
                                            }
                                            disabled={loading}
                                        >
                                            {showConfirmPassword
                                                ? "Hide"
                                                : "Show"}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="login-submit-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Resetting Password..."
                                        : "Reset Password"}
                                </button>

                                <button
                                    type="button"
                                    className="forgot-password-button"
                                    onClick={() =>
                                        navigate("/forgot-password")
                                    }
                                    disabled={loading}
                                >
                                    Request a New OTP
                                </button>
                            </form>
                        )}

                        {message && (
                            <button
                                type="button"
                                className="login-submit-button"
                                onClick={() => navigate("/login")}
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
