import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    forgotPassword,
    verifyResetOtp
} from "../services/authService";

import "../styles/login.css";

function ForgotPasswordPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("email");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Request OTP
    const handleRequestOtp = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        const normalizedEmail =
            email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError("Email address is required.");
            return;
        }

        try {
            setLoading(true);

            const data = await forgotPassword(
                normalizedEmail
            );

            setEmail(normalizedEmail);

            setMessage(
                data.message ||
                "If an account exists, a verification code has been sent."
            );

            setStep("otp");
        } catch (err) {
            setError(
                err.message ||
                "Unable to send verification code."
            );
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP
    const handleVerifyOtp = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        if (!/^\d{6}$/.test(otp.trim())) {
            setError(
                "Enter the 6-digit code sent to your email."
            );
            return;
        }

        try {
            setLoading(true);

            const data = await verifyResetOtp(
                email,
                otp.trim()
            );

            if (!data.resetToken) {
                throw new Error(
                    "Verification failed. Please request a new code."
                );
            }

            // The token is provided only after server verification.
            sessionStorage.setItem(
                "passwordResetToken",
                data.resetToken
            );

            navigate("/reset-password", {
                replace: true
            });
        } catch (err) {
            setError(
                err.message ||
                "Unable to verify the code."
            );
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResend = async () => {
        setError("");
        setMessage("");
        setOtp("");

        try {
            setLoading(true);

            const data = await forgotPassword(email);

            setMessage(
                data.message ||
                "If an account exists, a new verification code has been sent."
            );
        } catch (err) {
            setError(
                err.message ||
                "Unable to resend the code."
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

                            <h2>
                                {step === "email"
                                    ? "Forgot Password"
                                    : "Verify Email"}
                            </h2>

                            <p>
                                {step === "email"
                                    ? "Enter your registered email address to receive a verification code."
                                    : `Enter the 6-digit code sent to ${email}.`}
                            </p>
                        </div>

                        {error && (
                            <div
                                className="login-error"
                                role="alert"
                            >
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

                        {step === "email" ? (
                            <form
                                className="login-form"
                                onSubmit={handleRequestOtp}
                            >
                                <div className="form-group">
                                    <label htmlFor="email">
                                        Email Address
                                    </label>

                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Enter registered email"
                                        autoComplete="email"
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="login-submit-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Sending code..."
                                        : "Send Verification Code"}
                                </button>
                            </form>
                        ) : (
                            <form
                                className="login-form"
                                onSubmit={handleVerifyOtp}
                            >
                                <div className="form-group">
                                    <label htmlFor="otp">
                                        Verification Code
                                    </label>

                                    <input
                                        id="otp"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        pattern="[0-9]{6}"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(event) =>
                                            setOtp(
                                                event.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 6)
                                            )
                                        }
                                        placeholder="Enter 6-digit code"
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="login-submit-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Verifying..."
                                        : "Verify Code"}
                                </button>

                                <button
                                    type="button"
                                    className="forgot-password-button"
                                    onClick={handleResend}
                                    disabled={loading}
                                >
                                    Resend Code
                                </button>

                                <button
                                    type="button"
                                    className="forgot-password-button"
                                    onClick={() => {
                                        setStep("email");
                                        setOtp("");
                                        setMessage("");
                                        setError("");
                                    }}
                                    disabled={loading}
                                >
                                    Change Email
                                </button>
                            </form>
                        )}

                        <button
                            type="button"
                            className="forgot-password-button"
                            onClick={() => navigate("/login")}
                            disabled={loading}
                        >
                            Back to Login
                        </button>

                    </div>
                </section>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;