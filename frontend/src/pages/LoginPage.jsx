import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../services/authService";
import "../styles/login.css";

import LoginInfo from "../components/LoginInfo";
import LoginFormSection from "../components/LoginFormSection";
import ThemeToggle from "../components/ThemeToggle";


function LoginPage() {
    const navigate = useNavigate();

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
        <div className="login-page">
            <div className="login-theme-toggle">
      <ThemeToggle />
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
