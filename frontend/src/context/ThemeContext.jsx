import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem("app-theme");
        return savedTheme === "dark" ? "dark" : "light";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("app-theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((current) => current === "dark" ? "light" : "dark");
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
        throw new Error("useTheme must be used inside ThemeProvider");
    }
    return context;
}