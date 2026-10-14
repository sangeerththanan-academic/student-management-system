import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

    const handleSendOtp = async (event) => {
        event.preventDefault();

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const result = await forgotPassword(email);

            setMessage(
                result.message ||
                "If the account exists, an OTP has been sent."
            );

            setStep("otp");
        } catch (err) {
            setError(
                err.message || "Unable to send OTP. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (event) => {
        event.preventDefault();

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const result = await verifyResetOtp(email, otp);

            if (!result.resetToken) {
                throw new Error(
                    "Reset token was not returned by the server."
                );
            }

            navigate(
                `/reset-password?token=${encodeURIComponent(
                    result.resetToken
                )}`
            );
        } catch (err) {
            setError(
                err.message || "OTP verification failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <section className="login-form-section">
                <div className="login-card">
                    <h1>Forgot Password</h1>

                    {step === "email" && (
                        <>
                            <p>
                                Enter your registered email address.
                                We will send you a verification OTP.
                            </p>

                            <form onSubmit={handleSendOtp}>
                                <label htmlFor="reset-email">
                                    Email Address
                                </label>

                                <input
                                    id="reset-email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="Enter your registered email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    required
                                />

                                <button
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? "Sending..." : "Send OTP"}
                                </button>
                            </form>
                        </>
                    )}

                    {step === "otp" && (
                        <>
                            <p>
                                Enter the 6-digit OTP sent to your email.
                                It expires after 5 minutes.
                            </p>

                            <form onSubmit={handleVerifyOtp}>
                                <label htmlFor="reset-otp">
                                    Verification OTP
                                </label>

                                <input
                                    id="reset-otp"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(event) =>
                                        setOtp(
                                            event.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 6)
                                        )
                                    }
                                    required
                                />

                                <button
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? "Verifying..." : "Verify OTP"}
                                </button>

                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => {
                                        setStep("email");
                                        setOtp("");
                                        setError("");
                                        setMessage("");
                                    }}
                                >
                                    Change Email
                                </button>
                            </form>
                        </>
                    )}

                    {message && (
                        <p role="status">{message}</p>
                    )}

                    {error && (
                        <p role="alert">{error}</p>
                    )}

                    <p>
                        <Link to="/login">Back to Login</Link>
                    </p>
                </div>
            </section>
        </main>
    );
}

export default ForgotPasswordPage;