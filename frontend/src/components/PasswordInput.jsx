import { useState } from "react";
import { LuEye, LuEyeClosed } from "react-icons/lu";
import "../styles/passwordInput.css";

function PasswordInput({
    id = "password",
    name = "password",
    value,
    onChange,
    placeholder = "",
    autoComplete,
    disabled = false,
    required = false
}) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="password-input-wrapper">
            <input
                id={id}
                type={showPassword ? "text" : "password"}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                required={required}
            />

            <button
                type="button"
                className="password-toggle-button"
                onClick={() =>
                    setShowPassword((previous) => !previous)
                }
                disabled={disabled}
                aria-label={
                    showPassword ? "Hide password" : "Show password"
                }
                aria-pressed={showPassword}
            >
                {showPassword ? (
                    <LuEyeClosed />
                ) : (
                    <LuEye />
                )}
            </button>
        </div>
    );
}

export default PasswordInput;