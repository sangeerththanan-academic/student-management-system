import { useState } from "react";
import {
    requestPasswordReset,
    resetPassword,
    verifyPasswordResetOtp
} from "../services/authService";

function ForgotPasswordForm({ onBackToLogin }) {
    const [step, setStep] = useState("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const runRequest = async (request, nextStep) => {
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const data = await request();
            setMessage(data.message || "");
            setStep(nextStep);
        } catch (requestError) {
            setError(requestError.message || "Unable to process your request.");
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSubmit = (event) => {
        event.preventDefault();
        runRequest(
            () => requestPasswordReset(email.trim()),
            "otp"
        );
    };

    const handleOtpSubmit = (event) => {
        event.preventDefault();
        runRequest(
            async () => {
                const data = await verifyPasswordResetOtp(email.trim(), otp.trim());
                setResetToken(data.resetToken);
                return data;
            },
            "password"
        );
    };

    const handlePasswordSubmit = (event) => {
        event.preventDefault();
        runRequest(
            () => resetPassword(resetToken, password, confirmPassword),
            "complete"
        );
    };

    return (
        <section className="login-form-section">
            <div className="login-card">
                <div className="login-heading">
                    <span>PASSWORD RECOVERY</span>
                    <h2>
                        {step === "complete" ? "Password updated" : "Forgot password?"}
                    </h2>
                    <p>
                        {step === "email" && "Enter your registered email to receive an OTP."}
                        {step === "otp" && "Enter the six-digit OTP sent to your email."}
                        {step === "password" && "Create a new password for your account."}
                        {step === "complete" && "Your password has been changed successfully."}
                    </p>
                </div>

                {message && <div className="login-success" role="status">{message}</div>}
                {error && <div className="login-error" role="alert">{error}</div>}

                {step === "email" && (
                    <form className="login-form" onSubmit={handleEmailSubmit}>
                        <div className="form-group">
                            <label htmlFor="reset-email">Registered email</label>
                            <input
                                id="reset-email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                autoComplete="email"
                                disabled={loading}
                                required
                            />
                        </div>
                        <button className="login-submit-button" type="submit" disabled={loading}>
                            {loading ? "Sending OTP..." : "Send OTP"}
                        </button>
                    </form>
                )}

                {step === "otp" && (
                    <form className="login-form" onSubmit={handleOtpSubmit}>
                        <div className="form-group">
                            <label htmlFor="reset-otp">OTP</label>
                            <input
                                id="reset-otp"
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                maxLength="6"
                                value={otp}
                                onChange={(event) => setOtp(event.target.value)}
                                autoComplete="one-time-code"
                                disabled={loading}
                                required
                            />
                        </div>
                        <button className="login-submit-button" type="submit" disabled={loading}>
                            {loading ? "Verifying OTP..." : "Verify OTP"}
                        </button>
                    </form>
                )}

                {step === "password" && (
                    <form className="login-form" onSubmit={handlePasswordSubmit}>
                        <div className="form-group">
                            <label htmlFor="reset-password">New password</label>
                            <input
                                id="reset-password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="new-password"
                                disabled={loading}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="reset-confirm-password">Confirm new password</label>
                            <input
                                id="reset-confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                autoComplete="new-password"
                                disabled={loading}
                                required
                            />
                        </div>
                        <button className="login-submit-button" type="submit" disabled={loading}>
                            {loading ? "Changing password..." : "Change password"}
                        </button>
                    </form>
                )}

                {step === "complete" && (
                    <button className="login-submit-button" type="button" onClick={onBackToLogin}>
                        Back to sign in
                    </button>
                )}

                {step !== "complete" && (
                    <button
                        type="button"
                        className="forgot-password-link"
                        onClick={onBackToLogin}
                        disabled={loading}
                    >
                        Back to sign in
                    </button>
                )}
            </div>
        </section>
    );
}

export default ForgotPasswordForm;
