import { NavLink } from "react-router-dom";
import { Users, BookOpen } from "lucide-react";
import "./dashboard-sidebar.css";

function DashboardSidebar() {
    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-title">Management</div>
            <nav className="sidebar-nav">
                <NavLink
                    to="/dashboard/students"
                    className={({ isActive }) =>
                        `sidebar-nav-link ${isActive ? "active" : ""}`
                    }
                >
                    <Users size={18} />
                    <span>Students</span>
                </NavLink>

                <NavLink
                    to="/dashboard/courses"
                    className={({ isActive }) =>
                        `sidebar-nav-link ${isActive ? "active" : ""}`
                    }
                >
                    <BookOpen size={18} />
                    <span>Courses</span>
                </NavLink>
            </nav>
        </aside>
    );
}

export default DashboardSidebar;

