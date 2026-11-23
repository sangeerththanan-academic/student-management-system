import { NavLink } from "react-router-dom";

import "../styles/dashboard-sidebar.css";

function DashboardSidebar() {
    return (
        <aside className="dashboard-sidebar">

            <h2>Menu</h2>

            <nav className="dashboard-sidebar-nav">

                <NavLink
                    to="/dashboard/students"
                    className={({ isActive }) =>
                        isActive
                            ? "dashboard-sidebar-link active"
                            : "dashboard-sidebar-link"
                    }
                >
                    Students
                </NavLink>

                <NavLink
                    to="/dashboard/courses"
                    className={({ isActive }) =>
                        isActive
                            ? "dashboard-sidebar-link active"
                            : "dashboard-sidebar-link"
                    }
                >
                    Courses
                </NavLink>

            </nav>

        </aside>
    );
}

export default DashboardSidebar;