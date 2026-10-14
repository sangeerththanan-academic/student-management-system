import { Moon, Sun } from "lucide-react";

import { useTheme } from "../context/useTheme";

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const nextTheme = theme === "dark" ? "light" : "dark";
    const ThemeIcon = theme === "dark" ? Sun : Moon;

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme(nextTheme)}
            aria-label={`Switch to ${nextTheme} mode`}
            title={`Switch to ${nextTheme} mode`}
        >
            <ThemeIcon size={17} aria-hidden="true" />
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
    );
}

export default ThemeToggle;
