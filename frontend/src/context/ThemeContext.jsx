
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = "sms-theme";

function getInitialTheme() {
    try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

        return savedTheme === "dark" ? "dark" : "light";
    } catch {
        return "light";
    }
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);

        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // Continue working if browser storage is unavailable.
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((currentTheme) =>
            currentTheme === "light" ? "dark" : "light"
        );
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "useTheme must be used inside ThemeProvider"
        );
    }

    return context;
}