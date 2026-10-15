import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    login,
    requestStudentPasswordReset,
    resetStudentPassword,
    verifyStudentPasswordResetOtp
} from "../services/authService";
import "../styles/login.css";

import LoginInfo from "../components/LoginInfo";
import LoginFormSection from "../components/LoginFormSection";

function LoginPage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resetError, setResetError] = useState("");
    const [resetLoading, setResetLoading] = useState(false);

    const handleResetRequest = async (email) => {
        setResetError("");
        setResetLoading(true);
        try {
            return await requestStudentPasswordReset(email);
        } catch (requestError) {
            setResetError(requestError.message || "Unable to request a reset OTP");
            return null;
        } finally {
            setResetLoading(false);
        }
    };

    const handleResetOtpVerification = async (email, otp) => {
        setResetError("");
        setResetLoading(true);
        try {
            return await verifyStudentPasswordResetOtp(email, otp);
        } catch (verificationError) {
            setResetError(verificationError.message || "Unable to verify the OTP");
            return null;
        } finally {
            setResetLoading(false);
        }
    };

    const handlePasswordReset = async (resetToken, newPassword, confirmPassword) => {
        setResetError("");
        setResetLoading(true);
        try {
            await resetStudentPassword(resetToken, newPassword, confirmPassword);
            return true;
        } catch (resetRequestError) {
            setResetError(resetRequestError.message || "Unable to reset the password");
            return false;
        } finally {
            setResetLoading(false);
        }
    };

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

            <div className="login-container">

                {/* Information Side */}
                <LoginInfo onBack={handleBack} />

                {/* Form Side */}
                <LoginFormSection
                    onSubmit={handleLogin}
                    loading={loading}
                    error={error}
                    resetError={resetError}
                    resetLoading={resetLoading}
                    onResetRequest={handleResetRequest}
                    onVerifyResetOtp={handleResetOtpVerification}
                    onResetPassword={handlePasswordReset}
                />

            </div>

        </div>
    );
}

export default LoginPage;
