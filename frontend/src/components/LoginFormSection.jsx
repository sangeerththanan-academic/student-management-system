import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginFormSection({
    onSubmit,
    loading,
    error
}) {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(username.trim(), password);
    };

    const togglePasswordVisibility = () => {
        setShowPassword((previousState) => !previousState);
    };

    // Navigate to the Forgot Password page
    const handleForgotPassword = () => {
        navigate("/forgot-password");
    };

    return (
        <section className="login-form-section">
            <div className="login-card">
                <div className="login-heading">
                    <span>SIGN IN</span>

                    <h2>Welcome back</h2>

                    <p>
                        Sign in to access your account.
                    </p>
                </div>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                <form
                    className="login-form"
                    onSubmit={handleSubmit}
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

                        <div className="password-input-wrapper">
                            <input
                                id="password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
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
                                onClick={togglePasswordVisibility}
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                aria-pressed={showPassword}
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="20"
                                        height="20"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M3 3l18 18" />
                                        <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                                        <path d="M9.88 4.24A9.77 9.77 0 0 1 12 4c5 0 9.27 3.11 11 8a9.76 9.76 0 0 1-2.16 3.19" />
                                        <path d="M6.61 6.61A9.77 9.77 0 0 0 1 12c1.73 4.89 6 8 11 8a9.77 9.77 0 0 0 5.39-1.61" />
                                    </svg>
                                ) : (
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="20"
                                        height="20"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="3"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="login-submit-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign In"}
                    </button>

                    <button
                        type="button"
                        className="forgot-password-button"
                        onClick={handleForgotPassword}
                        disabled={loading}
                    >
                        Forgot Password?
                    </button>
                </form>
            </div>
        </section>
    );
}

export default LoginFormSection;
