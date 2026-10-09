import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
            {theme === "dark" ? <><Sun size={17} /><span>Light Mode</span></> : <><Moon size={17} /><span>Dark Mode</span></>}
        </button>
    );
}

export default ThemeToggle;