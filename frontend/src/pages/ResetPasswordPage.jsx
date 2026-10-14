import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/authService";
import "../styles/passwordRecovery.css";

function ResetPasswordPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";
    const otp = location.state?.otp || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    if (!email || !otp) {
        return (
            <main className="recovery-page">
                <section className="recovery-card">
                    <h1>Reset Password</h1>
                    <p>
                        Your OTP verification session is missing.
                        Please request a new OTP.
                    </p>
                    <Link to="/forgot-password">
                        Start Again
                    </Link>
                </section>
            </main>
        );
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            await resetPassword({
                email,
                otp,
                newPassword: password,
                confirmPassword
            });

            setSuccess(true);
        } catch (err) {
            setError(
                err.message ||
                "Unable to reset your password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <main className="recovery-page">
                <section className="recovery-card">
                    <div className="recovery-icon">✓</div>

                    <h1>Password Reset Successful</h1>

                    <p>
                        Your password has been changed successfully.
                        You can now sign in with your new password.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/login", { replace: true })
                        }
                    >
                        Go to Login
                    </button>
                </section>
            </main>
        );
    }

    return (
        <main className="recovery-page">
            <section className="recovery-card">
                <div className="recovery-icon">🔑</div>

                <h1>Create New Password</h1>

                <p>
                    Enter your new password and confirm it below.
                </p>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="new-password">
                        New Password
                    </label>

                    <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        minLength={8}
                        required
                    />

                    <label htmlFor="confirm-password">
                        Confirm New Password
                    </label>

                    <input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                        minLength={8}
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
                        {loading
                            ? "Resetting Password..."
                            : "Reset Password"}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default ResetPasswordPage;