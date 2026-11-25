import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import DashboardSidebar from "../../components/DashboardSidebar";
import ThemeToggle from "../../components/ThemeToggle";
import {
    getCurrentUser,
    getStoredUser,
    logout
} from "../../services/authService";
import "../../styles/dashboard.css";

function DashboardPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(getStoredUser());

    useEffect(() => {
        let active = true;

        const loadUser = async () => {
            try {
                const response = await getCurrentUser();

                if (active && response?.success) {
                    setUser(response.user);
                }
            } catch (error) {
                console.error("Failed to load user:", error);
                if (active) {
                    logout();
                    navigate("/login", { replace: true });
                }
            }
        };

        loadUser();

        return () => {
            active = false;
        };
    }, [navigate]);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="dashboard-layout">
            <DashboardSidebar />
            <div className="dashboard-main">
                <header className="admin-dashboard-header">
                    <div>
                        <h1>Student Management System</h1>
                        <p>Administrator Dashboard</p>
                    </div>
                    <div className="admin-dashboard-actions">
                        {user && (
                            <div className="admin-info">
                                <strong>Welcome, {user.username}</strong>
                                <span>ADMINISTRATOR</span>
                            </div>
                        )}
                        <ThemeToggle />
                        <button
                            type="button"
                            className="logout-button"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </header>
                <main className="dashboard-route-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DashboardPage;
