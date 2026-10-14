import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/authService";
import "../styles/login.css";
import "../styles/forgotpassword.css";

function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!token) {
            setError(
                "Reset token is missing. Please request a new OTP."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        const strongPassword =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (!strongPassword.test(password)) {
            setError(
                "Password must contain at least 8 characters, uppercase and lowercase letters, a number, and a special character."
            );
            return;
        }

        setLoading(true);

        try {
            const result = await resetPassword(
                token,
                password,
                confirmPassword
            );

            setSuccess(
                result.message ||
                "Password reset successful."
            );

            setPassword("");
            setConfirmPassword("");

            // Give the user time to read the success message.
            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 1500);
        } catch (err) {
            setError(
                err.message || "Unable to reset password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <section className="login-form-section">
                <div className="login-card">
                    <h1>Reset Password</h1>

                    <p>
                        Create a new password for your account.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <label htmlFor="new-password">
                            New Password
                        </label>

                        <input
                            id="new-password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder="Enter new password"
                            required
                        />

                        <label htmlFor="confirm-password">
                            Confirm New Password
                        </label>

                        <input
                            id="confirm-password"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                            placeholder="Confirm new password"
                            required
                        />

                        <p>
                            Password must contain at least 8 characters,
                            including uppercase, lowercase, number and
                            special character.
                        </p>

                        <button
                            type="submit"
                            disabled={loading || !token}
                        >
                            {loading
                                ? "Updating..."
                                : "Reset Password"}
                        </button>
                    </form>

                    {error && (
                        <p role="alert">{error}</p>
                    )}

                    {success && (
                        <p role="status">{success}</p>
                    )}

                    <p>
                        <Link to="/login">Back to Login</Link>
                    </p>
                </div>
            </section>
        </main>
    );
}

export default ResetPasswordPage;