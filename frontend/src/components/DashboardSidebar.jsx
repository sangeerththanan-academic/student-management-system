import { NavLink } from "react-router-dom";
import { BookOpen, GraduationCap, LayoutDashboard } from "lucide-react";
import "../styles/dashboard.css";

function DashboardSidebar() {
    return (
        <aside className="dashboard-sidebar">
            <NavLink to="/dashboard/students" className="sidebar-logo">
                <span className="sidebar-logo-icon"><GraduationCap size={25} /></span>
                <span><strong>Campus</strong><small>ADMIN PORTAL</small></span>
            </NavLink>
            <div className="sidebar-section-label">MANAGEMENT</div>
            <nav className="sidebar-nav" aria-label="Dashboard navigation">
                <NavLink to="/dashboard/students" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                    <LayoutDashboard size={18} /><span>Students</span>
                </NavLink>
                <NavLink to="/dashboard/courses" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                    <BookOpen size={18} /><span>Courses</span>
                </NavLink>
            </nav>
            <div className="sidebar-footer"><span className="sidebar-status-dot" /> Management Portal</div>
        </aside>
    );
}

export default DashboardSidebar;
