// import { useState } from "react";

// function LoginFormSection({ onSubmit, loading, error }) {
//     const [username, setUsername] = useState("");
//     const [password, setPassword] = useState("");
//     const [showPassword, setShowPassword] = useState(false);

//     const handleSubmit = (event) => {
//         event.preventDefault();
//         onSubmit(username.trim(), password);
//     };

//     return (
//         <section className="login-form-section">
//             <div className="login-card">
//                 <div className="login-heading">
//                     <span>SIGN IN</span>
//                     <h2>Welcome back</h2>
//                     <p>Sign in to access your account.</p>
//                 </div>

//                 {error && (
//                     <div className="login-error" role="alert">
//                         {error}
//                     </div>
//                 )}

//                 <form className="login-form" onSubmit={handleSubmit}>
//                     <div className="form-group">
//                         <label htmlFor="username">Username</label>

//                         <input
//                             id="username"
//                             type="text"
//                             value={username}
//                             onChange={(event) =>
//                                 setUsername(event.target.value)
//                             }
//                             placeholder="Enter your username"
//                             autoComplete="username"
//                             disabled={loading}
//                             required
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label htmlFor="loginPassword">Password</label>

//                         <div className="password-input-wrapper">
//                             <input
//                                 id="loginPassword"
//                                 className="password-input"
//                                 type={showPassword ? "text" : "password"}
//                                 value={password}
//                                 onChange={(event) =>
//                                     setPassword(event.target.value)
//                                 }
//                                 placeholder="Enter your password"
//                                 autoComplete="current-password"
//                                 disabled={loading}
//                                 required
//                             />

//                             <button
//                                 type="button"
//                                 className="password-toggle-button"
//                                 onClick={() =>
//                                     setShowPassword((previous) => !previous)
//                                 }
//                                 aria-label={
//                                     showPassword
//                                         ? "Hide password"
//                                         : "Show password"
//                                 }
//                                 aria-pressed={showPassword}
//                                 title={
//                                     showPassword
//                                         ? "Hide password"
//                                         : "Show password"
//                                 }
//                                 disabled={loading}
//                             >
//                                 {showPassword ? (
//                                     // Password visible: eye-slash icon
//                                     <svg
//                                         viewBox="0 0 24 24"
//                                         width="22"
//                                         height="22"
//                                         fill="none"
//                                         stroke="currentColor"
//                                         strokeWidth="2"
//                                         strokeLinecap="round"
//                                         strokeLinejoin="round"
//                                         aria-hidden="true"
//                                     >
//                                         <path d="M3 3l18 18" />
//                                         <path d="M10.6 10.6a2 2 0 002.8 2.8" />
//                                         <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7a11 11 0 01-3.1 4.2" />
//                                         <path d="M6.2 6.2A13 13 0 002.5 12c1 2.5 4.5 7 9.5 7 1.2 0 2.3-.3 3.3-.7" />
//                                     </svg>
//                                 ) : (
//                                     // Password hidden: eye icon
//                                     <svg
//                                         viewBox="0 0 24 24"
//                                         width="22"
//                                         height="22"
//                                         fill="none"
//                                         stroke="currentColor"
//                                         strokeWidth="2"
//                                         strokeLinecap="round"
//                                         strokeLinejoin="round"
//                                         aria-hidden="true"
//                                     >
//                                         <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
//                                         <circle cx="12" cy="12" r="3" />
//                                     </svg>
//                                 )}
//                             </button>
//                         </div>
//                     </div>

//                     <button
//                         type="submit"
//                         className="login-submit-button"
//                         disabled={loading}
//                     >
//                         {loading ? "Signing in..." : "Sign In"}
//                     </button>
//                 </form>
//             </div>
//         </section>
//     );
// }

// export default LoginFormSection;


import { useState } from "react";

import {
    forgotPassword,
    verifyResetOtp,
    resetPassword
} from "../services/authService";

function LoginFormSection({ onSubmit, loading, error }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Password reset states
    const [forgotMode, setForgotMode] = useState(false);
    const [resetStep, setResetStep] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState("");
    const [resetMessage, setResetMessage] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(username.trim(), password);
    };

    const openForgotPassword = () => {
        setForgotMode(true);
        setResetStep(1);
        setResetError("");
        setResetMessage("");
    };

    const backToLogin = () => {
        setForgotMode(false);
        setResetStep(1);
        setEmail("");
        setOtp("");
        setResetToken("");
        setNewPassword("");
        setConfirmPassword("");
        setResetError("");
        setResetMessage("");
    };

    // Step 1: Send OTP to email
    const handleSendOtp = async (event) => {
        event.preventDefault();
        setResetError("");
        setResetMessage("");

        try {
            setResetLoading(true);

            const data = await forgotPassword(email.trim());

            setResetMessage(
                data.message ||
                "If the email belongs to an account, an OTP will be sent."
            );

            // Continue to OTP entry only after the API succeeds.
            setResetStep(2);
        } catch (err) {
            setResetError(
                err.message || "Could not send OTP. Please try again."
            );
        } finally {
            setResetLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (event) => {
        event.preventDefault();
        setResetError("");
        setResetMessage("");

        if (!/^\d{6}$/.test(otp.trim())) {
            setResetError("Enter the 6-digit OTP from your email.");
            return;
        }

        try {
            setResetLoading(true);

            const data = await verifyResetOtp(email.trim(), otp.trim());

            if (!data.resetToken) {
                throw new Error("Reset token was not returned by the server.");
            }

            setResetToken(data.resetToken);
            setResetMessage("OTP verified. You can set a new password.");
            setResetStep(3);
        } catch (err) {
            setResetError(
                err.message || "OTP verification failed. Please try again."
            );
        } finally {
            setResetLoading(false);
        }
    };

    // Step 3: Save new password
    const handleResetPassword = async (event) => {
        event.preventDefault();
        setResetError("");
        setResetMessage("");

        if (newPassword !== confirmPassword) {
            setResetError("Passwords do not match.");
            return;
        }

        const strongPassword =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

        if (!strongPassword.test(newPassword)) {
            setResetError(
                "Password must be at least 8 characters and include uppercase, lowercase, number and special character."
            );
            return;
        }

        try {
            setResetLoading(true);

            const data = await resetPassword(
                resetToken,
                newPassword,
                confirmPassword
            );

            setResetMessage(
                data.message || "Password reset successfully."
            );

            setNewPassword("");
            setConfirmPassword("");
            setOtp("");
            setResetToken("");

            // Return to login after successful password reset.
            setResetStep(1);
            setForgotMode(false);
            setPassword("");
        } catch (err) {
            setResetError(
                err.message || "Could not reset password. Please try again."
            );
        } finally {
            setResetLoading(false);
        }
    };

    // Forgot Password UI
    if (forgotMode) {
        return (
            <section className="login-form-section">
                <div className="login-card">
                    <div className="login-heading">
                        <span>ACCOUNT RECOVERY</span>

                        <h2>
                            {resetStep === 1 && "Forgot Password?"}
                            {resetStep === 2 && "Verify OTP"}
                            {resetStep === 3 && "Create New Password"}
                        </h2>

                        <p>
                            {resetStep === 1 &&
                                "Enter your registered email address to receive an OTP."}

                            {resetStep === 2 &&
                                `Enter the 6-digit OTP sent to ${email}.`}

                            {resetStep === 3 &&
                                "Choose a strong new password for your account."}
                        </p>
                    </div>

                    {resetError && (
                        <div className="login-error" role="alert">
                            {resetError}
                        </div>
                    )}

                    {resetMessage && (
                        <div
                            className="login-success-message"
                            role="status"
                        >
                            {resetMessage}
                        </div>
                    )}

                    {resetStep === 1 && (
                        <form
                            className="login-form"
                            onSubmit={handleSendOtp}
                        >
                            <div className="form-group">
                                <label htmlFor="resetEmail">
                                    Registered Email
                                </label>

                                <input
                                    id="resetEmail"
                                    type="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    placeholder="Enter your email address"
                                    autoComplete="email"
                                    disabled={resetLoading}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="login-submit-button"
                                disabled={resetLoading}
                            >
                                {resetLoading
                                    ? "Sending OTP..."
                                    : "Send OTP"}
                            </button>
                        </form>
                    )}

                    {resetStep === 2 && (
                        <form
                            className="login-form"
                            onSubmit={handleVerifyOtp}
                        >
                            <div className="form-group">
                                <label htmlFor="resetOtp">
                                    6-Digit OTP
                                </label>

                                <input
                                    id="resetOtp"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    value={otp}
                                    onChange={(event) =>
                                        setOtp(
                                            event.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 6)
                                        )
                                    }
                                    placeholder="Enter the 6-digit OTP"
                                    disabled={resetLoading}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="login-submit-button"
                                disabled={resetLoading}
                            >
                                {resetLoading
                                    ? "Verifying..."
                                    : "Verify OTP"}
                            </button>

                            <button
                                type="button"
                                className="forgot-back-button"
                                onClick={() => {
                                    setResetStep(1);
                                    setOtp("");
                                    setResetError("");
                                    setResetMessage("");
                                }}
                                disabled={resetLoading}
                            >
                                Change Email
                            </button>
                        </form>
                    )}

                    {resetStep === 3 && (
                        <form
                            className="login-form"
                            onSubmit={handleResetPassword}
                        >
                            <div className="form-group">
                                <label htmlFor="newResetPassword">
                                    New Password
                                </label>

                                <input
                                    id="newResetPassword"
                                    type={
                                        showNewPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={newPassword}
                                    onChange={(event) =>
                                        setNewPassword(event.target.value)
                                    }
                                    placeholder="Enter a new password"
                                    autoComplete="new-password"
                                    minLength={8}
                                    disabled={resetLoading}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmResetPassword">
                                    Confirm New Password
                                </label>

                                <input
                                    id="confirmResetPassword"
                                    type={
                                        showNewPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(event.target.value)
                                    }
                                    placeholder="Confirm your new password"
                                    autoComplete="new-password"
                                    minLength={8}
                                    disabled={resetLoading}
                                    required
                                />
                            </div>

                            <label className="reset-show-password">
                                <input
                                    type="checkbox"
                                    checked={showNewPassword}
                                    onChange={(event) =>
                                        setShowNewPassword(event.target.checked)
                                    }
                                    disabled={resetLoading}
                                />
                                Show password
                            </label>

                            <p className="reset-password-hint">
                                Use at least 8 characters, including uppercase,
                                lowercase, a number and a special character.
                            </p>

                            <button
                                type="submit"
                                className="login-submit-button"
                                disabled={resetLoading}
                            >
                                {resetLoading
                                    ? "Updating Password..."
                                    : "Reset Password"}
                            </button>
                        </form>
                    )}

                    <button
                        type="button"
                        className="forgot-back-button"
                        onClick={backToLogin}
                        disabled={resetLoading}
                    >
                        Back to Sign In
                    </button>
                </div>
            </section>
        );
    }

    // Normal Login UI
    return (
        <section className="login-form-section">
            <div className="login-card">
                <div className="login-heading">
                    <span>SIGN IN</span>
                    <h2>Welcome back</h2>
                    <p>Sign in to access your account.</p>
                </div>

                {error && (
                    <div className="login-error" role="alert">
                        {error}
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>

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
                        <label htmlFor="loginPassword">Password</label>

                        <div className="password-input-wrapper">
                            <input
                                id="loginPassword"
                                className="password-input"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={loading}
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle-button"
                                onClick={() =>
                                    setShowPassword((previous) => !previous)
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                aria-pressed={showPassword}
                                title={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="22"
                                        height="22"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M3 3l18 18" />
                                        <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                                        <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7a11 11 0 01-3.1 4.2" />
                                        <path d="M6.2 6.2A13 13 0 002.5 12c1 2.5 4.5 7 9.5 7 1.2 0 2.3-.3 3.3-.7" />
                                    </svg>
                                ) : (
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="22"
                                        height="22"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="forgot-password-row">
                        <button
                            type="button"
                            className="forgot-password-link"
                            onClick={openForgotPassword}
                            disabled={loading}
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="login-submit-button"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </section>
    );
}

export default LoginFormSection;


