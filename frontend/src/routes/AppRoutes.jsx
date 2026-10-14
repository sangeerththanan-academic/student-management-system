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
import VerifyOTPPage from "../pages/VerifyOTPPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<LandingPage />}
                />

                <Route
                    path="/login"
                    element={<LoginPage />}
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute role="ADMIN">
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/student-dashboard"
                    element={
                        <ProtectedRoute role="STUDENT">
                            <StudentDashboardPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />

                <Route
                    path="/verify-otp"
                    element={<VerifyOTPPage />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;