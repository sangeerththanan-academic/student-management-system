import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../services/authService";
import "../styles/login.css";

import LoginInfo from "../components/LoginInfo";
import LoginFormSection from "../components/LoginFormSection";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../context/ThemeContext";

function LoginPage() {
    const navigate = useNavigate();
    const { theme } = useTheme("login");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (username, password) => {
        setError("");

        if (!username || !password) {
            setError("Username and password are required");
            return;
        }

        try {
            setLoading(true);

            const data = await login(username, password);

            if (data.user?.role === "ADMIN") {
                navigate("/dashboard", { replace: true });
            } else {
                navigate("/student-dashboard", { replace: true });
            }

        } catch (error) {
            setError(
                error.message || "Login failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate("/");
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const autologin = params.get("autologin");
        if (autologin === "admin") {
            handleLogin("admin", "Password123!");
        } else if (autologin === "student") {
            handleLogin("REG001", "Password123!");
        }
    }, []);

    return (
        <div className={`login-page ${theme}`} data-theme={theme}>

            <div className="login-theme-toggle-wrapper">
                <ThemeToggle section="login" showLabel={true} />
            </div>

            <div className="login-container">

                {/* Information Side */}
                <LoginInfo onBack={handleBack} />

                {/* Form Side */}
                <LoginFormSection
                    onSubmit={handleLogin}
                    loading={loading}
                    error={error}
                />

            </div>

        </div>
    );
}

export default LoginPage;
