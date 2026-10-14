
import { useState } from "react";
import {
    useNavigate,
    useSearchParams
} from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { resetPassword } from "../services/authService";
import "../styles/login.css";

function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const email = searchParams.get("email") || "";

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

        if (!email) {
            setError(
                "Email address is missing. Please request an OTP again."
            );
            return;
        }

        if (!/^\d{6}$/.test(otp)) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }

        if (password.length < 8) {
            setError(
                "Password must be at least 8 characters long."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const data = await resetPassword(
                email,
                otp,
                password,
                confirmPassword
            );

            setMessage(
                data.message || "Password reset successful."
            );

            setOtp("");
            setPassword("");
            setConfirmPassword("");
        } catch (error) {
            setError(
                error.message || "Unable to reset password."
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
                                Enter the OTP sent to your registered
                                email and create a new password.
                            </p>
                        </div>

                        <div className="login-success" role="status">
                            If an account exists for this email address, a
                            6-digit OTP has been sent. Check your inbox and
                            spam folder.
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
                                    <label htmlFor="email">
                                        Registered Email
                                    </label>

                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        readOnly
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="otp">
                                        6-Digit OTP
                                    </label>

                                    <input
                                        id="otp"
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
                                        placeholder="Enter OTP"
                                        maxLength={6}
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password">
                                        New Password
                                    </label>

                                    <div className="password-wrapper">
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(event.target.value)
                                            }
                                            placeholder="Enter new password"
                                            autoComplete="new-password"
                                            disabled={loading}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() =>
                                                setShowPassword((visible) => !visible)
                                            }
                                            disabled={loading}
                                            aria-label={
                                                showPassword
                                                    ? "Hide new password"
                                                    : "Show new password"
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff aria-hidden="true" />
                                            ) : (
                                                <Eye aria-hidden="true" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">
                                        Confirm New Password
                                    </label>

                                    <div className="password-wrapper">
                                        <input
                                            id="confirmPassword"
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={confirmPassword}
                                            onChange={(event) =>
                                                setConfirmPassword(event.target.value)
                                            }
                                            placeholder="Confirm new password"
                                            autoComplete="new-password"
                                            disabled={loading}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    (visible) => !visible
                                                )
                                            }
                                            disabled={loading}
                                            aria-label={
                                                showConfirmPassword
                                                    ? "Hide confirmation password"
                                                    : "Show confirmation password"
                                            }
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff aria-hidden="true" />
                                            ) : (
                                                <Eye aria-hidden="true" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="login-submit-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Resetting..."
                                        : "Verify OTP & Reset Password"}
                                </button>
                            </form>
                        )}

                        {message && (
                            <button
                                type="button"
                                className="recovery-secondary-button"
                                onClick={() => navigate("/login")}
                            >
                                Back to Login
                            </button>
                        )}

                        {!message && (
                            <button
                                type="button"
                                className="recovery-secondary-button"
                                onClick={() => navigate("/forgot-password")}
                                disabled={loading}
                            >
                                Request a New OTP
                            </button>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default ResetPasswordPage;
