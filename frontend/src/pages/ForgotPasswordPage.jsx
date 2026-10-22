import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, RotateCw } from "lucide-react";

import { forgotPassword, verifyOtp, resetPassword } from "../services/authService";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../context/ThemeContext";
import "../styles/login.css";

function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { theme } = useTheme("login");

    // Flow state: "EMAIL" | "OTP" | "NEW_PASSWORD" | "SUCCESS"
    const [step, setStep] = useState("EMAIL");

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [verifiedToken, setVerifiedToken] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [infoMessage, setInfoMessage] = useState("");

    // Step 1: Submit Email to receive OTP
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setInfoMessage("");

        const cleanEmail = email.trim();
        if (!cleanEmail) {
            setError("Please enter your registered email address.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            setError("Please enter a valid email address (e.g. user@example.com).");
            return;
        }

        try {
            setLoading(true);
            const res = await forgotPassword(cleanEmail);
            setInfoMessage(res.message || "A 6-digit verification code has been sent to your email.");
            setStep("OTP");
        } catch (err) {
            setError(err.message || "Failed to send verification code. Please check SMTP configuration.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify 6-digit OTP
    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const cleanOtp = otp.trim();
        if (!cleanOtp) {
            setError("Please enter the 6-digit verification code sent to your email.");
            return;
        }

        if (cleanOtp.length < 6) {
            setError("Verification code must be exactly 6 digits.");
            return;
        }

        try {
            setLoading(true);
            const res = await verifyOtp(email.trim(), cleanOtp);
            setVerifiedToken(res.token || cleanOtp);
            setError("");
            setInfoMessage("");
            setStep("NEW_PASSWORD");
        } catch (err) {
            setError(err.message || "Invalid or expired verification code. Please check and try again.");
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        setError("");
        try {
            setResending(true);
            const res = await forgotPassword(email.trim());
            setInfoMessage(res.message || "A new 6-digit code has been sent to your email.");
        } catch (err) {
            setError(err.message || "Failed to resend verification code.");
        } finally {
            setResending(false);
        }
    };

    // Step 3: Set New Password
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!password || !confirmPassword) {
            setError("Please fill in both password fields.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match. Please re-enter.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        try {
            setLoading(true);
            const tokenToUse = verifiedToken || otp.trim();
            await resetPassword(tokenToUse, password, confirmPassword, email.trim());
            setStep("SUCCESS");
        } catch (err) {
            setError(err.message || "Failed to update password. Your session may have expired.");
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

                    <div className="login-back-nav">
                        <Link to="/login" id="back-to-login-top" className="back-link">
                            <ArrowLeft size={16} /> Back to Sign In
                        </Link>
                    </div>

                    {/* Step 1: Enter Email */}
                    {step === "EMAIL" && (
                        <>
                            <div className="login-heading">
                                <div className="forgot-icon-badge">
                                    <KeyRound size={28} />
                                </div>
                                <h2>Forgot Password?</h2>
                                <p>
                                    Enter your registered email address below. We will send you a 6-digit verification code (OTP) to reset your password.
                                </p>
                            </div>

                            {error && (
                                <div className="login-error" role="alert" aria-live="polite">
                                    <AlertCircle size={16} className="alert-icon" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form className="login-form" onSubmit={handleEmailSubmit} noValidate>
                                <div className="form-group">
                                    <label htmlFor="forgot-email">
                                        Registered Email Address
                                    </label>
                                    <div className="input-with-icon">
                                        <input
                                            id="forgot-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            autoComplete="email"
                                            disabled={loading}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    id="forgot-submit-btn"
                                    className="login-submit-button"
                                    disabled={loading}
                                >
                                    {loading ? "Sending Code via SMTP..." : "Send Verification Code"}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 2: Enter OTP Menu */}
                    {step === "OTP" && (
                        <>
                            <div className="login-heading">
                                <div className="forgot-icon-badge">
                                    <KeyRound size={28} />
                                </div>
                                <h2>Enter Verification Code</h2>
                                <p>
                                    We sent a 6-digit verification code to <strong>{email}</strong>. Enter it below to proceed:
                                </p>
                            </div>

                            {infoMessage && (
                                <div className="login-success-banner" role="status" aria-live="polite">
                                    <CheckCircle2 size={18} className="success-icon" />
                                    <div>
                                        <p className="success-title">Code Dispatched</p>
                                        <p className="success-text">{infoMessage}</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="login-error" role="alert" aria-live="polite">
                                    <AlertCircle size={16} className="alert-icon" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form className="login-form" onSubmit={handleOtpSubmit} noValidate>
                                <div className="form-group">
                                    <label htmlFor="otp-input">
                                        6-Digit Verification Code (OTP)
                                    </label>
                                    <div className="input-with-icon">
                                        <input
                                            id="otp-input"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                            placeholder="••••••"
                                            autoComplete="one-time-code"
                                            disabled={loading}
                                            required
                                            autoFocus
                                            style={{
                                                letterSpacing: "6px",
                                                fontSize: "20px",
                                                fontWeight: "bold",
                                                textAlign: "center"
                                            }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    id="verify-otp-btn"
                                    className="login-submit-button"
                                    disabled={loading || otp.length < 6}
                                >
                                    {loading ? "Verifying Code..." : "Confirm OTP & Continue"}
                                </button>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", fontSize: "13px" }}>
                                    <button
                                        type="button"
                                        onClick={() => { setStep("EMAIL"); setError(""); setInfoMessage(""); }}
                                        style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 0 }}
                                    >
                                        &larr; Change Email
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={resending}
                                        style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 600, padding: 0 }}
                                    >
                                        {resending ? "Sending..." : "Resend Code"}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {/* Step 3: Enter New Password Page */}
                    {step === "NEW_PASSWORD" && (
                        <>
                            <div className="login-heading">
                                <div className="forgot-icon-badge">
                                    <ShieldCheck size={28} />
                                </div>
                                <h2>Set New Password</h2>
                                <p>
                                    Create a secure new password for your account associated with <strong>{email}</strong>.
                                </p>
                            </div>

                            {error && (
                                <div className="login-error" role="alert" aria-live="polite">
                                    <AlertCircle size={16} className="alert-icon" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form className="login-form" onSubmit={handlePasswordSubmit} noValidate>
                                {/* New Password */}
                                <div className="form-group">
                                    <label htmlFor="new-password">
                                        New Password *
                                    </label>
                                    <div className="password-input-wrapper">
                                        <input
                                            id="new-password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter new password (min. 6 chars)"
                                            autoComplete="new-password"
                                            disabled={loading}
                                            required
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            disabled={loading}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm New Password */}
                                <div className="form-group">
                                    <label htmlFor="confirm-new-password">
                                        Confirm New Password *
                                    </label>
                                    <div className="password-input-wrapper">
                                        <input
                                            id="confirm-new-password"
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
                                            className="password-toggle-btn"
                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                            disabled={loading}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="reset-policy-hint" style={{ fontSize: "13px", color: "#64748b", margin: "12px 0 20px" }}>
                                    <div>• Minimum 6 characters</div>
                                    <div>• Passwords must match identically</div>
                                </div>

                                <button
                                    type="submit"
                                    id="reset-submit-btn"
                                    className="login-submit-button"
                                    disabled={loading}
                                >
                                    {loading ? "Updating Password..." : "Save New Password"}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 4: Success State */}
                    {step === "SUCCESS" && (
                        <div className="reset-success-state" style={{ textAlign: "center", padding: "20px 0" }}>
                            <div className="forgot-icon-badge success-badge" style={{ margin: "0 auto 16px" }}>
                                <CheckCircle2 size={36} color="#16a34a" />
                            </div>
                            <h2>Password Reset Complete!</h2>
                            <p className="success-description" style={{ color: "#475569", margin: "12px 0 24px" }}>
                                Your password has been successfully updated. You can now sign in using your new password.
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
                    )}

                    <div className="forgot-footer">
                        <span>Remember your password?</span>{" "}
                        <Link to="/login" id="back-to-login-bottom" className="forgot-login-link">
                            Sign in here
                        </Link>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default ForgotPasswordPage;

