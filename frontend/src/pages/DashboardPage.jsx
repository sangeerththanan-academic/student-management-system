// CR006: Admin dashboard layout shell.
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import DashboardSidebar from "../components/DashboardSidebar";
import ThemeToggle from "../components/ThemeToggle";
import {
    getStoredUser,
    getCurrentUser,
    logout
} from "../services/authService";

import "../styles/dashboard.css";
import "../components/dashboard-sidebar.css";

function DashboardPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(getStoredUser());

    const redirectToLogin = () => {
        logout();
        navigate("/login", { replace: true });
    };

    useEffect(() => {
        const loadUser = async () => {
            try {
                const data = await getCurrentUser();

                if (data.user) {
                    setUser({
                        id: data.user.user_id,
                        username: data.user.username,
                        role: data.user.role
                    });
                }
            } catch (error) {
                if (error.status === 401) {
                    redirectToLogin();
                }
            }
        };

        loadUser();
    }, []);

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <div>
                    <h1>Student Management System</h1>
                    <p>Administrator Dashboard</p>
                </div>

                <div className="dashboard-header-actions">
                    <div className="admin-info">
                        <strong>{user?.username}</strong>
                    </div>

                    <button
                        type="button"
                        onClick={redirectToLogin}
                        className="logout-button"
                    >
                        Logout
                    </button>

                    <ThemeToggle />
                </div>
            </header>

            <div className="dashboard-layout">
                <DashboardSidebar />

                <main className="dashboard-content">
                    <Outlet context={{ user, redirectToLogin }} />
                </main>
            </div>
        </div>
    );
}

export default DashboardPage;
