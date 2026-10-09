
import { useState } from "react";
import "./PasswordInput.css";

function PasswordInput({
    id,
    name,
    value,
    onChange,
    disabled = false,
    required = false,
    autoComplete = "current-password",
    placeholder = "Enter your password",
    className = "",
    invalid = false
}) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="password-input-wrapper">
            <input
                id={id}
                name={name}
                type={showPassword ? "text" : "password"}
                value={value}
                onChange={onChange}
                disabled={disabled}
                required={required}
                autoComplete={autoComplete}
                placeholder={placeholder}
                className={`password-input-field ${className}`}
                aria-invalid={invalid}
            />

            <button
                type="button"
                className="password-toggle-button"
                onClick={() => {
                    setShowPassword((previous) => !previous);
                }}
                disabled={disabled}
                aria-label={
                    showPassword ? "Hide password" : "Show password"
                }
                aria-pressed={showPassword}
                aria-controls={id}
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
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 5.2A11 11 0 0 1 12 5c5 0 8.5 4.5 9 7-.2 1.1-1 2.3-2 3.4" />
                        <path d="M6.2 6.2C3.9 7.7 2.4 10 2 12c.5 2.5 4 7 10 7 1.3 0 2.5-.3 3.6-.8" />
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
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
            </button>
        </div>
    );
}

export default PasswordInput;