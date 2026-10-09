import { useState } from "react";
import PasswordInput from "./PasswordInput";

function LoginFormSection({ onSubmit, loading, error }) {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(username.trim(), password);
    };

    return (
        <section className="login-form-section">

            <div className="login-card">

                <div className="login-heading">

                    <span>
                        SIGN IN
                    </span>

                    <h2>
                        Welcome back
                    </h2>

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

                        <PasswordInput
                            id="password"
                            name="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder="Enter your password"
                            autoComplete="current-password"
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
                            ? "Signing in..."
                            : "Sign In"
                        }
                    </button>

                </form>

            </div>

        </section>
    );
}

export default LoginFormSection;