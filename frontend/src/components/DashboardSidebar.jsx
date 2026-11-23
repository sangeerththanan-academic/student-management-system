import { NavLink } from "react-router-dom";

function DashboardSidebar() {
    return (
        <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
            <nav>
                <NavLink
                    to="/dashboard/students"
                    className={({ isActive }) =>
                        `dashboard-sidebar-link${isActive ? " active" : ""}`
                    }
                >
                    Students
                </NavLink>
                <NavLink
                    to="/dashboard/courses"
                    className={({ isActive }) =>
                        `dashboard-sidebar-link${isActive ? " active" : ""}`
                    }
                >
                    Courses
                </NavLink>
            </nav>
        </aside>
    );
}

export default DashboardSidebar;
