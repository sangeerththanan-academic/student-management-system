import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

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
        document.documentElement.setAttribute(
            "data-theme",
            theme
        );

        document.documentElement.style.colorScheme = theme;

        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // Theme still works during the current session.
        }
    }, [theme]);

    const value = useMemo(
        () => ({
            theme,

            toggleTheme: () => {
                setTheme((currentTheme) =>
                    currentTheme === "dark"
                        ? "light"
                        : "dark"
                );
            },

            setTheme,
        }),
        [theme]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "useTheme must be used within ThemeProvider"
        );
    }

    return context;
}