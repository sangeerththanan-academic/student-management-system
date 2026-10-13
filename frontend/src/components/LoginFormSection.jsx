import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function LoginFormSection({ onSubmit, loading, error }) {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
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

    <div className="password-input-wrapper">
        <input
            id="password"
            type={showPassword ? "text" : "password"}
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

        <button
            type="button"
            className="password-toggle"
            aria-label={
                showPassword ? "Hide password" : "Show password"
            }
            aria-pressed={showPassword}
            onClick={() =>
                setShowPassword((previous) => !previous)
            }
            disabled={loading}
        >
            {showPassword ? (
                <EyeOff size={21} aria-hidden="true" />
            ) : (
                <Eye size={21} aria-hidden="true" />
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
                            : "Sign In"
                        }
                    </button>

                </form>

            </div>

        </section>
    );
}

export default LoginFormSection;