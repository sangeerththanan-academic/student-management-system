// CR006: Admin dashboard module navigation.
import { NavLink } from "react-router-dom";

function DashboardSidebar() {
    return (
        <aside className="dashboard-sidebar">
            <nav aria-label="Dashboard navigation">
                <NavLink
                    to="/dashboard/students"
                    className={({ isActive }) =>
                        `dashboard-nav-link${isActive ? " active" : ""}`
                    }
                >
                    Students
                </NavLink>

                <NavLink
                    to="/dashboard/courses"
                    className={({ isActive }) =>
                        `dashboard-nav-link${isActive ? " active" : ""}`
                    }
                >
                    Courses
                </NavLink>
            </nav>
        </aside>
    );
}

export default DashboardSidebar;