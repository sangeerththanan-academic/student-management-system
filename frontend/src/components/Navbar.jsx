
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import "../styles/navbar.css";

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="logo">
                    ABC Institute
                </Link>

                <div className="nav-links">
                    <Link to="/" className="nav-link">
                        Home
                    </Link>

                    <Link to="/login" className="login-button">
                        Login
                    </Link>

                    <ThemeToggle />
                </div>
            </div>
        </nav>
    );
}

export default Navbar;

