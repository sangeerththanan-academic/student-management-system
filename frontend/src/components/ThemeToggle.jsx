import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function ThemeToggle({ section, className = "", showLabel = false }) {
    const { theme, isDark, toggleTheme } = useTheme(section);

    return (
        <button
            type="button"
            className={`theme-toggle-btn ${isDark ? "theme-toggle-dark" : "theme-toggle-light"} ${className}`}
            onClick={toggleTheme}
            aria-label={isDark ? `Switch ${section} to light mode` : `Switch ${section} to dark mode`}
            aria-pressed={isDark}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            <span className="theme-toggle-icon-wrap" aria-hidden="true">
                {isDark ? (
                    <Sun size={17} className="theme-icon sun-icon" />
                ) : (
                    <Moon size={17} className="theme-icon moon-icon" />
                )}
            </span>
            {showLabel && (
                <span className="theme-toggle-text">
                    {isDark ? "Light Mode" : "Dark Mode"}
                </span>
            )}
        </button>
    );
}

export default ThemeToggle;
