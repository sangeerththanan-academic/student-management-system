
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../services/authService";
import "../styles/login.css";

import LoginInfo from "../components/LoginInfo";
import LoginFormSection from "../components/LoginFormSection";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../context/ThemeContext";

function LoginPage() {
    const navigate = useNavigate();
    const { getTheme } = useTheme();

    const theme = getTheme("login");

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

    return (
        <div
            className="login-page"
            data-theme={theme}
        >
            <div className="login-theme-control">
                <ThemeToggle scope="login" />
            </div>

            <div className="login-container">
                <LoginInfo onBack={handleBack} />

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

