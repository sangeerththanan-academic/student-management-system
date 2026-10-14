
import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import StudentDashboardPage from "../pages/StudentDashboardPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Landing Page */}
                <Route
                    path="/"
                    element={<LandingPage />}
                />

                {/* Login Page */}
                <Route
                    path="/login"
                    element={<LoginPage />}
                />

                {/* Forgot Password - Email OTP */}
                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />

                {/* Reset Password - New Password */}
                <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                />

                {/* Admin Dashboard */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute role="ADMIN">
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />

                {/* Student Dashboard */}
                <Route
                    path="/student-dashboard"
                    element={
                        <ProtectedRoute role="STUDENT">
                            <StudentDashboardPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;
