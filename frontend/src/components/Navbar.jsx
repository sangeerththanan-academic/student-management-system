
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../context/ThemeContext";

function Navbar() {
    const { getTheme } = useTheme();
    const theme = getTheme("home");

    return (
        <nav
            className="navbar"
            data-theme={theme}
        >
            <div className="navbar-container">
                <Link to="/" className="logo">
                    Student Management System
                </Link>

                <div className="nav-links">
                    <Link to="/" className="nav-link">
                        Home
                    </Link>

                    <ThemeToggle scope="home" />

                    <Link to="/login" className="login-button">
                        Login
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;

