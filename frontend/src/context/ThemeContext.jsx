
import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "student-management-theme";

function getSavedTheme() {
    try {
        const savedTheme = localStorage.getItem(STORAGE_KEY);

        return savedTheme === "dark" ? "dark" : "light";
    } catch (error) {
        console.error("Failed to load theme:", error);
        return "light";
    }
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getSavedTheme);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (error) {
            console.error("Failed to save theme:", error);
        }

        // Apply the selected theme to the entire application.
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.style.colorScheme = theme;
    }, [theme]);

    // Keep compatibility with existing pages.
    const getTheme = () => theme;

    // Every toggle changes the same global theme.
    const toggleTheme = () => {
        setTheme((currentTheme) =>
            currentTheme === "dark" ? "light" : "dark"
        );
    };

    const setGlobalTheme = (newTheme) => {
        if (newTheme === "light" || newTheme === "dark") {
            setTheme(newTheme);
        }
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                getTheme,
                setTheme: setGlobalTheme,
                toggleTheme,
            }}
        >
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