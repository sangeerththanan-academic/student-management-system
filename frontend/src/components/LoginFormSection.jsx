import { useState } from "react";

function LoginFormSection({ onSubmit, loading, error }) {
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

    return (
        <section className="login-form-section">
            <div className="login-card">

                {/* Login Heading */}
                <div className="login-heading">
                    <span>SIGN IN</span>

                    <h2>Welcome back</h2>

                    <p>
                        Sign in to access your account.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div
                        className="login-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >

                    {/* Username Field */}
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

                    {/* Password Field */}
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
                                className="password-input"
                                disabled={loading}
                                required
                            />

                            {/* Show / Hide Password Button */}
                            <button
                                type="button"
                                className="password-toggle"
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
                                    /* Eye-slash icon */
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                        focusable="false"
                                    >
                                        <path d="M3 3l18 18" />
                                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                                        <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.3 4.5 9 7a11.8 11.8 0 0 1-3 4.6" />
                                        <path d="M6.6 6.6A12 12 0 0 0 3 12c.7 2.5 4 7 9 7 1.1 0 2.1-.2 3-.6" />
                                    </svg>
                                ) : (
                                    /* Eye icon */
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                        focusable="false"
                                    >
                                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
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

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="login-submit-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign In"}
                    </button>

                </form>
            </div>
        </section>
    );
}

export default LoginFormSection;