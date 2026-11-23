import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import DashboardSidebar from "../components/DashboardSidebar";
import { getStoredUser, getCurrentUser, logout } from "../services/authService";
import "../styles/dashboard.css";

function DashboardPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(getStoredUser());

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
                    logout();
                    navigate("/login", { replace: true });
                }
            }
        };

        loadUser();
    }, [navigate]);

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
                    <button type="button" onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </header>

            <div className="dashboard-layout">
                <DashboardSidebar />
                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DashboardPage;
