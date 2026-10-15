import { useRef, useState } from "react";
import PasswordShowHide from "./PasswordShowHide";

function LoginFormSection({
    onSubmit,
    loading,
    error,
    resetError,
    resetLoading,
    onResetRequest,
    onVerifyResetOtp,
    onResetPassword
}) {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [resetStep, setResetStep] = useState("login");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetMessage, setResetMessage] = useState("");
    const otpInputs = useRef([]);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(username.trim(), password);
    };

    const handleRequestReset = async (event) => {
        event.preventDefault();
        const result = await onResetRequest(email.trim());
        if (result) {
            setResetMessage(result.message);
            setResetStep("otp");
        }
    };

    const handleVerifyOtp = async (event) => {
        event.preventDefault();
        const result = await onVerifyResetOtp(email.trim(), otp);
        if (result?.resetToken) {
            setResetToken(result.resetToken);
            setResetMessage("");
            setResetStep("password");
        }
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();
        const success = await onResetPassword(resetToken, newPassword, confirmPassword);
        if (success) {
            setResetStep("complete");
            setResetMessage("Your password has been reset. You can now sign in.");
        }
    };

    const handleOtpChange = (index, value) => {
        const digits = value.replace(/\D/g, "");
        if (digits.length > 1) {
            const nextOtp = digits.slice(0, 6);
            setOtp(nextOtp);
            otpInputs.current[Math.min(nextOtp.length, 5)]?.focus();
            return;
        }

        const nextOtp = otp.split("");
        nextOtp[index] = digits;
        setOtp(nextOtp.join(""));
        if (digits && index < 5) {
            otpInputs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, event) => {
        if (event.key === "Backspace" && !otp[index] && index > 0) {
            otpInputs.current[index - 1]?.focus();
        }
    };

    const returnToLogin = () => {
        setResetStep("login");
        setOtp("");
        setResetToken("");
        setNewPassword("");
        setConfirmPassword("");
        setResetMessage("");
    };

    return (
        <section className="login-form-section">

            <div className="login-card">

                <div className="login-heading">

                    <span>
                        {resetStep === "login" ? "SIGN IN" : "STUDENT ACCOUNT"}
                    </span>

                    <h2>
                        {resetStep === "login" && "Welcome back"}
                        {resetStep === "email" && "Reset your password"}
                        {resetStep === "otp" && "Check your email"}
                        {resetStep === "password" && "Choose a new password"}
                        {resetStep === "complete" && "Password updated"}
                    </h2>

                    <p>
                        {resetStep === "login" && "Sign in to access your account."}
                        {resetStep === "email" && "Enter the email address linked to your student account."}
                        {resetStep === "otp" && "Enter the six-digit code sent to your student email."}
                        {resetStep === "password" && "Choose and confirm your new password."}
                        {resetStep === "complete" && "You can now sign in with your new password."}
                    </p>

                </div>


                {resetStep === "login" && error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                {resetError && resetStep !== "login" && (
                    <div className="login-error" role="alert">
                        {resetError}
                    </div>
                )}

                {resetMessage && (
                    <div className="login-success" role="status">
                        {resetMessage}
                    </div>
                )}


                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                    hidden={resetStep !== "login"}
                >

                    <div className="form-group">

                        <label htmlFor="username">
                            Username
                        </label>

                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(event) =>
                                setUsername(event.target.value)
                            }
                            placeholder="Enter your username"
                            autoComplete="username"
                            disabled={loading}
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="password">
                            Password
                        </label>

                        <PasswordShowHide password={password} setPassword={setPassword} loadingVal={loading} />

                    </div>

                    <button
                        type="button"
                        className="forgot-password-link"
                        onClick={() => {
                            setResetMessage("");
                            setResetStep("email");
                        }}
                    >
                        Forgot password?
                    </button>


                    <button
                        type="submit"
                        className="login-submit-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign In"
                        }
                    </button>

                </form>

                {resetStep === "email" && <form className="login-form" onSubmit={handleRequestReset}>
                    <div className="form-group">
                        <label htmlFor="reset-email">Student email</label>
                        <input
                            id="reset-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Enter your student email"
                            autoComplete="email"
                            disabled={resetLoading}
                            required
                        />
                    </div>
                    <button type="submit" className="login-submit-button" disabled={resetLoading}>
                        {resetLoading ? "Sending..." : "Send OTP"}
                    </button>
                    <button type="button" className="forgot-password-link" onClick={returnToLogin}>
                        Back to sign in
                    </button>
                </form>}

                {resetStep === "otp" && <form className="login-form" onSubmit={handleVerifyOtp}>
                    <div className="form-group">
                        <label htmlFor="reset-otp-0">Six-digit OTP</label>
                        <div className="reset-otp-inputs">
                            {Array.from({ length: 6 }, (_, index) => (
                                <input
                                    key={index}
                                    ref={(element) => { otpInputs.current[index] = element; }}
                                    id={`reset-otp-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete={index === 0 ? "one-time-code" : "off"}
                                    maxLength={index === 0 ? 6 : 1}
                                    aria-label={`OTP digit ${index + 1}`}
                                    value={otp[index] || ""}
                                    onChange={(event) => handleOtpChange(index, event.target.value)}
                                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                                    disabled={resetLoading}
                                    required
                                />
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="login-submit-button" disabled={resetLoading || otp.length !== 6}>
                        {resetLoading ? "Verifying..." : "Verify OTP"}
                    </button>
                    <button type="button" className="forgot-password-link" onClick={() => setResetStep("email")}>
                        Use a different email
                    </button>
                    <button
                        type="button"
                        className="forgot-password-link"
                        disabled={resetLoading}
                        onClick={async () => {
                            setResetMessage("");
                            const result = await onResetRequest(email.trim());
                            if (result) {
                                setResetMessage("A new OTP has been sent if the email belongs to a student account.");
                            }
                        }}
                    >
                        Resend OTP
                    </button>
                </form>}

                {resetStep === "password" && <form className="login-form" onSubmit={handleResetPassword}>
                    <div className="form-group">
                        <label htmlFor="new-password">New password</label>
                        <input
                            id="new-password"
                            type="password"
                            autoComplete="new-password"
                            minLength={8}
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            disabled={resetLoading}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirm-new-password">Re-enter new password</label>
                        <input
                            id="confirm-new-password"
                            type="password"
                            autoComplete="new-password"
                            minLength={8}
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            disabled={resetLoading}
                            required
                        />
                    </div>
                    <button type="submit" className="login-submit-button" disabled={resetLoading}>
                        {resetLoading ? "Saving..." : "Save new password"}
                    </button>
                </form>}

                {resetStep === "complete" && <button type="button" className="login-submit-button" onClick={returnToLogin}>
                    Return to sign in
                </button>}

            </div>

        </section>
    );
}

export default LoginFormSection;