
import {
    createContext,
    useContext,
    useState,
    useEffect,
} from "react";

const ThemeContext = createContext(null);

const THEME_KEYS = {
    login: "loginTheme",
    admin: "adminTheme",
    student: "studentTheme",
};

function getSavedTheme(section) {
    const savedTheme = localStorage.getItem(THEME_KEYS[section]);

    return savedTheme === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }) {
    const [themes, setThemes] = useState(() => ({
        login: getSavedTheme("login"),
        admin: getSavedTheme("admin"),
        student: getSavedTheme("student"),
    }));

    useEffect(() => {
        Object.entries(themes).forEach(([section, theme]) => {
            localStorage.setItem(THEME_KEYS[section], theme);
        });
    }, [themes]);

    const toggleTheme = (section) => {
        if (!THEME_KEYS[section]) return;

        setThemes((previousThemes) => ({
            ...previousThemes,
            [section]:
                previousThemes[section] === "light"
                    ? "dark"
                    : "light",
        }));
    };

    const getTheme = (section) => {
        return themes[section] || "light";
    };

    return (
        <ThemeContext.Provider
            value={{ themes, getTheme, toggleTheme }}
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
