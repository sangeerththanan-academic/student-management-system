import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Key, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";

import { verifyResetToken, resetPassword } from "../services/authService";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../context/ThemeContext";
import "../styles/login.css";

function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const { theme } = useTheme("login");

    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [tokenError, setTokenError] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Verify token validity upon mounting
    useEffect(() => {
        if (!token) {
            navigate("/forgot-password", { replace: true });
            return;
        }

        const checkToken = async () => {
            try {
                setVerifying(true);
                await verifyResetToken(token);
                setTokenValid(true);
                setTokenError("");
            } catch (err) {
                setTokenValid(false);
                setTokenError(err.message || "This password reset link is invalid, expired, or has already been used.");
            } finally {
                setVerifying(false);
            }
        };

        checkToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        // FR-008 & FR-009: Input validation
        if (!password || !confirmPassword) {
            setFormError("Please fill in both password fields.");
            return;
        }

        // FR-009 / TC-008: Password matching check
        if (password !== confirmPassword) {
            setFormError("Passwords do not match. Please re-enter.");
            return;
        }

        // FR-010 / TC-009: Password policy check (min 6 characters)
        if (password.length < 6) {
            setFormError("Password must be at least 6 characters long.");
            return;
        }

        try {
            setLoading(true);
            const res = await resetPassword(token, password, confirmPassword);

            // FR-012 / TC-010: Success state
            setSuccessMessage(res.message || "Your password has been reset successfully. You can now log in with your new password.");
            setPassword("");
            setConfirmPassword("");

        } catch (err) {
            // FR-013: Error state
            setFormError(err.message || "Failed to reset password. The link may have expired or already been used.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`login-page ${theme}`} data-theme={theme}>

            <div className="login-theme-toggle-wrapper">
                <ThemeToggle section="login" showLabel={true} />
            </div>

            <div className="login-container forgot-container-single">

                <div className="login-card forgot-card">

                    {verifying ? (
                        <div className="reset-verifying-state">
                            <div className="spinner"></div>
                            <p>Verifying password reset token...</p>
                        </div>
                    ) : !tokenValid ? (
                        <div className="reset-invalid-state">
                            <div className="forgot-icon-badge error-badge">
                                <AlertCircle size={32} />
                            </div>
                            <h2>Invalid Reset Link</h2>
                            <p className="error-description">
                                {tokenError}
                            </p>
                            <Link to="/forgot-password" id="request-new-reset-btn" className="login-submit-button btn-link-action">
                                Request New Reset Link
                            </Link>
                            <div className="forgot-footer">
                                <Link to="/login" className="forgot-login-link">
                                    <ArrowLeft size={14} /> Back to Sign In
                                </Link>
                            </div>
                        </div>
                    ) : successMessage ? (
                        <div className="reset-success-state">
                            <div className="forgot-icon-badge success-badge">
                                <ShieldCheck size={32} />
                            </div>
                            <h2>Password Reset Complete</h2>
                            <p className="success-description">
                                {successMessage}
                            </p>
                            <button
                                type="button"
                                id="proceed-to-login-btn"
                                className="login-submit-button"
                                onClick={() => navigate("/login")}
                            >
                                Proceed to Sign In
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="login-back-nav">
                                <Link to="/login" id="back-to-login-top" className="back-link">
                                    <ArrowLeft size={16} /> Back to Sign In
                                </Link>
                            </div>

                            <div className="login-heading">
                                <div className="forgot-icon-badge">
                                    <Key size={28} />
                                </div>
                                <h2>Reset Your Password</h2>
                                <p>
                                    Please create a secure new password for your account. Passwords are encrypted before storage.
                                </p>
                            </div>

                            {formError && (
                                <div className="login-error" role="alert" aria-live="polite">
                                    <AlertCircle size={16} className="alert-icon" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            <form className="login-form" onSubmit={handleSubmit} noValidate>

                                {/* New Password */}
                                <div className="form-group">
                                    <label htmlFor="reset-password">
                                        New Password *
                                    </label>
                                    <div className="password-input-wrapper">
                                        <input
                                            id="reset-password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter new password (min. 6 characters)"
                                            autoComplete="new-password"
                                            disabled={loading}
                                            required
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            id="reset-toggle-pwd-btn"
                                            className="password-toggle-btn"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            aria-pressed={showPassword}
                                            disabled={loading}
                                        >
                                            {showPassword ? (
                                                <EyeOff size={18} className="eye-icon" aria-hidden="true" />
                                            ) : (
                                                <Eye size={18} className="eye-icon" aria-hidden="true" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm New Password */}
                                <div className="form-group">
                                    <label htmlFor="reset-confirm-password">
                                        Confirm New Password *
                                    </label>
                                    <div className="password-input-wrapper">
                                        <input
                                            id="reset-confirm-password"
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
                                            id="reset-toggle-conf-btn"
                                            className="password-toggle-btn"
                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                            aria-pressed={showConfirmPassword}
                                            disabled={loading}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff size={18} className="eye-icon" aria-hidden="true" />
                                            ) : (
                                                <Eye size={18} className="eye-icon" aria-hidden="true" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="reset-policy-hint">
                                    <span>• Minimum 6 characters (FR-010)</span>
                                    <span>• Passwords must match identically (FR-009)</span>
                                </div>

                                <button
                                    type="submit"
                                    id="reset-submit-btn"
                                    className="login-submit-button"
                                    disabled={loading}
                                >
                                    {loading ? "Resetting Password..." : "Reset Password"}
                                </button>

                            </form>
                        </>
                    )}

                </div>

            </div>

        </div>
    );
}

export default ResetPasswordPage;
