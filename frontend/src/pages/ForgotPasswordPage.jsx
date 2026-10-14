
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import apiRequest from "../services/api";
import { getStoredUser } from "../services/authService";
import "../styles/login.css";

function ForgotPasswordPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");

    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Step 1: Request an OTP for the registered Student email.
    const handleRequestOtp = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError("Please enter your registered email address.");
            return;
        }

        try {
            setLoading(true);

            const data = await apiRequest(
                "/api/auth/student/request-login-otp",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email: normalizedEmail
                    })
                }
            );

            setEmail(normalizedEmail);
            setOtpSent(true);
            setOtp("");
            setMessage(
                data.message || "OTP sent to your registered email."
            );
        } catch (err) {
            setError(
                err.message || "Unable to send OTP. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP and log in the Student.
    const handleVerifyOtp = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedOtp = otp.trim();

        if (!/^\d{6}$/.test(normalizedOtp)) {
            setError("Please enter the 6-digit OTP.");
            return;
        }

        try {
            setLoading(true);

            const data = await apiRequest(
                "/api/auth/student/verify-login-otp",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email: normalizedEmail,
                        otp: normalizedOtp
                    })
                }
            );

            if (!data.token || !data.user) {
                throw new Error("Login response is incomplete.");
            }

            // Store the same login data used by the normal login flow.
            localStorage.setItem("token", data.token);
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            setMessage("Login successful. Redirecting...");

            if (
                String(data.user.role).toUpperCase() !== "STUDENT"
            ) {
                setError("This OTP login is available for Students only.");
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                return;
            }

            navigate("/student-dashboard", { replace: true });
        } catch (err) {
            setError(
                err.message || "OTP verification failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBackToEmail = () => {
        setOtpSent(false);
        setOtp("");
        setMessage("");
        setError("");
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <section className="login-form-section">
                    <div className="login-card">
                        <div className="login-heading">
                            <span>STUDENT ACCOUNT LOGIN</span>

                            <h2>
                                {otpSent
                                    ? "Verify Your OTP"
                                    : "Forgot Password?"}
                            </h2>

                            <p>
                                {otpSent
                                    ? "Enter the 6-digit verification code sent to your registered email. You will be logged in after verification."
                                    : "Enter your registered Student email address to receive a login verification code."}
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

                        {!otpSent ? (
                            <form
                                className="login-form"
                                onSubmit={handleRequestOtp}
                            >
                                <div className="form-group">
                                    <label htmlFor="forgot-email">
                                        Registered Email Address
                                    </label>

                                    <input
                                        id="forgot-email"
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

                                <button
                                    type="submit"
                                    className="login-submit-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Sending OTP..."
                                        : "Send OTP"}
                                </button>

                                <button
                                    type="button"
                                    className="forgot-password-button"
                                    onClick={() => navigate("/login")}
                                    disabled={loading}
                                >
                                    Back to Login
                                </button>
                            </form>
                        ) : (
                            <form
                                className="login-form"
                                onSubmit={handleVerifyOtp}
                            >
                                <div className="form-group">
                                    <label htmlFor="otp-email">
                                        Registered Email Address
                                    </label>

                                    <input
                                        id="otp-email"
                                        type="email"
                                        value={email}
                                        readOnly
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="student-login-otp">
                                        6-Digit OTP
                                    </label>

                                    <input
                                        id="student-login-otp"
                                        type="text"
                                        inputMode="numeric"
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
                                        placeholder="Enter 6-digit OTP"
                                        autoComplete="one-time-code"
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="login-submit-button"
                                    disabled={loading || otp.length !== 6}
                                >
                                    {loading
                                        ? "Verifying..."
                                        : "Verify OTP & Login"}
                                </button>

                                <button
                                    type="button"
                                    className="forgot-password-button"
                                    onClick={handleBackToEmail}
                                    disabled={loading}
                                >
                                    Change Email
                                </button>

                                <button
                                    type="button"
                                    className="forgot-password-button"
                                    onClick={handleRequestOtp}
                                    disabled={loading}
                                >
                                    Send New OTP
                                </button>
                            </form>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;
