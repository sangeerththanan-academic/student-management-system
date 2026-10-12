
import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import StudentDashboardPage from "../pages/StudentDashboardPage";

import ProtectedRoute from "./ProtectedRoute";
import ThemeSection from "../components/ThemeSection";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        <ThemeSection section="login">
                            <LandingPage />
                        </ThemeSection>
                    }
                />

                <Route
                    path="/login"
                    element={
                        <ThemeSection section="login">
                            <LoginPage />
                        </ThemeSection>
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute role="ADMIN">
                            <ThemeSection section="admin">
                                <DashboardPage />
                            </ThemeSection>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/student-dashboard"
                    element={
                        <ProtectedRoute role="STUDENT">
                            <ThemeSection section="student">
                                <StudentDashboardPage />
                            </ThemeSection>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;
