import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

const ThemeContext = createContext(null);

const STORAGE_KEYS = {
    login: "sms_login_theme",
    admin: "sms_admin_theme",
    student: "sms_student_theme",
};

function readTheme(section) {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS[section]);

        return saved === "dark" || saved === "light"
            ? saved
            : "light";
    } catch {
        return "light";
    }
}

export function ThemeProvider({ children }) {
    const [themes, setThemes] = useState(() => ({
        login: readTheme("login"),
        admin: readTheme("admin"),
        student: readTheme("student"),
    }));

    const [activeSection, setActiveSection] = useState("login");

    function setSectionTheme(section, theme) {
        if (!STORAGE_KEYS[section]) return;
        if (theme !== "light" && theme !== "dark") return;

        setThemes((previous) => ({
            ...previous,
            [section]: theme,
        }));

        try {
            localStorage.setItem(STORAGE_KEYS[section], theme);
        } catch (error) {
            console.warn("Could not save theme preference:", error);
        }
    }

    // Keep the document theme synchronized with the active page.
    useEffect(() => {
        document.documentElement.setAttribute(
            "data-theme",
            themes[activeSection] || "light"
        );
    }, [themes, activeSection]);

    return (
        <ThemeContext.Provider
            value={{
                themes,
                setSectionTheme,
                setActiveSection,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useSectionTheme(section) {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "Theme components must be inside ThemeProvider."
        );
    }

    if (!STORAGE_KEYS[section]) {
        throw new Error(`Invalid theme section: ${section}`);
    }

    const theme = context.themes[section];

    function toggleTheme() {
        context.setSectionTheme(
            section,
            theme === "light" ? "dark" : "light"
        );
    }

    return {
        theme,
        toggleTheme,
    };
}

export function useApplySectionTheme(section) {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "Page must be inside ThemeProvider."
        );
    }

    const theme = context.themes[section];

    useEffect(() => {
        context.setActiveSection(section);

        document.documentElement.setAttribute(
            "data-theme",
            theme
        );
    }, [section, theme, context.setActiveSection]);
}



