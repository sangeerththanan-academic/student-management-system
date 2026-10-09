import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import "../styles/login.css";

function PasswordShowHide({ password, setPassword, loadingVal }) {

    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <div className="password-input-wrapper">
            <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loadingVal}
                required
            />

            <button
                type="button"
                className="password-toggle-button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loadingVal}
            >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
        </div>
    )
}

export default PasswordShowHide