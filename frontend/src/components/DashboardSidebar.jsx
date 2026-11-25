import { NavLink } from 'react-router-dom';
import './dashboard-sidebar.css';

export default function DashboardSidebar() {
  const linkClass = ({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link');
  return (
    <aside className="dashboard-sidebar">
      <h2 className="sidebar-title">Admin Panel</h2>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard/students" className={linkClass}>Students</NavLink>
        <NavLink to="/dashboard/courses" className={linkClass}>Courses</NavLink>
      </nav>
    </aside>
  );
}
