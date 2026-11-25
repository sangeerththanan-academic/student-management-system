import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/admin/DashboardPage";
import StudentDashboardPage from "../pages/StudentDashboardPage";
import StudentsView from "../pages/admin/StudentsView";
import CoursesView from "../pages/admin/CoursesView";

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
                >
                    <Route index element={<Navigate to="students" replace />} />
                    <Route path="students" element={<StudentsView />} />
                    <Route path="courses" element={<CoursesView />} />
                </Route>

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
