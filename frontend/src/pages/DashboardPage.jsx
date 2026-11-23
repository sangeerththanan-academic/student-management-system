import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { GraduationCap, LogOut } from "lucide-react";
import { getCurrentUser, getStoredUser, logout } from "../services/authService";
import DashboardSidebar from "../components/DashboardSidebar";
import "../styles/dashboard.css";

function DashboardPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(getStoredUser());
    const [userLoaded, setUserLoaded] = useState(false);

    useEffect(() => {
        let active = true;
        getCurrentUser()
            .then((data) => {
                if (active && data.user) {
                    setUser({ id: data.user.user_id, username: data.user.username, role: data.user.role });
                }
            })
            .catch((error) => {
                if (error.status === 401) {
                    logout();
                    navigate("/login", { replace: true });
                }
            })
            .finally(() => active && setUserLoaded(true));
        return () => { active = false; };
    }, [navigate]);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    if (!userLoaded && !user) return <div className="dashboard-loading">Loading dashboard...</div>;
    if (!userLoaded && user?.role !== "ADMIN") return <div className="dashboard-loading">Loading dashboard...</div>;
    if (user?.role && user.role !== "ADMIN") return <Navigate to="/student-dashboard" replace />;

    return (
        <div className="dashboard-page">
            <DashboardSidebar />
            <div className="dashboard-main">
                <header className="dashboard-header">
                    <div className="dashboard-brand">
                        <span className="dashboard-brand-icon"><GraduationCap size={22} /></span>
                        <div><h1>Student Management System</h1><p>Administrator Dashboard</p></div>
                    </div>
                    <div className="dashboard-header-actions">
                        <div className="admin-avatar">{user?.username?.charAt(0)?.toUpperCase() || "A"}</div>
                        <div className="admin-info"><strong>{user?.username}</strong><span>{user?.role}</span></div>
                        <button onClick={handleLogout} className="logout-button"><LogOut size={16} /> Logout</button>
                    </div>
                </header>
                <main className="dashboard-content"><Outlet /></main>
            </div>
        </div>
    );
}

export default DashboardPage;
