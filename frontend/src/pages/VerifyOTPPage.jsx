import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { verifyPasswordOTP } from "../services/authService";
import "../styles/passwordRecovery.css";

function VerifyOTPPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!email) {
        return (
            <main className="recovery-page">
                <section className="recovery-card">
                    <h1>Verify OTP</h1>

                    <p>
                        Please request a password-reset OTP first.
                    </p>

                    <Link to="/forgot-password">
                        Request OTP
                    </Link>
                </section>
            </main>
        );
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!/^\d{6}$/.test(otp)) {
            setError("Enter the 6-digit OTP sent to your email.");
            return;
        }

        try {
            setLoading(true);

            await verifyPasswordOTP(email, otp);

            // No reset token is required.
            navigate("/reset-password", {
                replace: true,
                state: {
                    email,
                    otp
                }
            });
        } catch (err) {
            setError(
                err.message ||
                "OTP verification failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="recovery-page">
            <section className="recovery-card">
                <div className="recovery-icon">🔐</div>

                <h1>Verify Your Email</h1>

                <p>
                    Enter the 6-digit OTP sent to your email address.
                </p>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="recovery-otp">
                        Email OTP
                    </label>

                    <input
                        id="recovery-otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(event) =>
                            setOtp(
                                event.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 6)
                            )
                        }
                        maxLength={6}
                        required
                    />

                    {error && (
                        <div
                            className="recovery-error"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                </form>

                <Link
                    className="recovery-back-link"
                    to="/forgot-password"
                >
                    Request a new OTP
                </Link>
            </section>
        </main>
    );
}

export default VerifyOTPPage;