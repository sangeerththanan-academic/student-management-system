import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import {
    getStoredUser,
    getCurrentUser,
    logout
} from "../services/authService";

import DashboardSidebar from "../components/DashboardSidebar";
import "../styles/dashboard.css";

function DashboardPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(getStoredUser());

    // Load current user
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
                console.error("Failed to load current user:", error);

                if (error.status === 401) {
                    logout();
                    navigate("/login", { replace: true });
                }
            }
        };

        loadUser();
    }, [navigate]);

    // Logout
    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

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
                        <span>{user?.role}</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="logout-button"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div className="dashboard-layout">
                {/* FR-004, FR-006: Dashboard Sidebar */}
                <DashboardSidebar />

                {/* FR-001, FR-006: Module Content Outlet */}
                <main className="dashboard-main">
                    <div className="dashboard-content">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default DashboardPage;
