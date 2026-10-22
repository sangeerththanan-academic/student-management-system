import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import DashboardPage from "../pages/DashboardPage";
import StudentDashboardPage from "../pages/StudentDashboardPage";

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

                {/* CR-026: Forgot Password & Reset Password Routes */}
                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
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

            </Routes>

        </BrowserRouter>
    );
}

export default AppRoutes;
