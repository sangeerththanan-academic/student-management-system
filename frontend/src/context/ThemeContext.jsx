import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext(null);

const VALID_THEMES = ["light", "dark"];

const getStoredTheme = (section) => {
    try {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const queryTheme = params.get(`${section}Theme`) || params.get("theme");
            if (queryTheme && VALID_THEMES.includes(queryTheme)) {
                localStorage.setItem(`sms_theme_${section}`, queryTheme);
                return queryTheme;
            }
        }
        const stored = localStorage.getItem(`sms_theme_${section}`);
        if (stored && VALID_THEMES.includes(stored)) {
            return stored;
        }
    } catch {
        // Fallback if localStorage is inaccessible
    }
    return "light";
};

export function ThemeProvider({ children }) {
    const [themes, setThemes] = useState({
        login: getStoredTheme("login"),
        admin: getStoredTheme("admin"),
        student: getStoredTheme("student"),
        home: getStoredTheme("home"),
    });

    const [activeSection, setActiveSectionState] = useState("home");

    // Apply active section theme to document element
    const applyThemeToDOM = useCallback((section, theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.setAttribute("data-section", section);
    }, []);

    const setActiveSection = useCallback((section) => {
        setActiveSectionState(section);
        const currentTheme = themes[section] || getStoredTheme(section);
        applyThemeToDOM(section, currentTheme);
    }, [themes, applyThemeToDOM]);

    const toggleTheme = useCallback((section) => {
        setThemes((prev) => {
            const current = prev[section] || "light";
            const nextTheme = current === "dark" ? "light" : "dark";

            try {
                localStorage.setItem(`sms_theme_${section}`, nextTheme);
            } catch {
                // Ignore localStorage errors
            }

            if (section === activeSection) {
                applyThemeToDOM(section, nextTheme);
            }

            return {
                ...prev,
                [section]: nextTheme,
            };
        });
    }, [activeSection, applyThemeToDOM]);

    const setSectionTheme = useCallback((section, theme) => {
        if (!VALID_THEMES.includes(theme)) return;

        setThemes((prev) => {
            try {
                localStorage.setItem(`sms_theme_${section}`, theme);
            } catch {
                // Ignore localStorage errors
            }

            if (section === activeSection) {
                applyThemeToDOM(section, theme);
            }

            return {
                ...prev,
                [section]: theme,
            };
        });
    }, [activeSection, applyThemeToDOM]);

    return (
        <ThemeContext.Provider
            value={{
                themes,
                activeSection,
                setActiveSection,
                toggleTheme,
                setSectionTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(section) {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    const {
        themes,
        activeSection,
        setActiveSection,
        toggleTheme,
        setSectionTheme,
    } = context;

    useEffect(() => {
        if (section) {
            setActiveSection(section);
        }
    }, [section, setActiveSection]);

    if (!section) {
        return context;
    }

    const theme = themes[section] || "light";
    const isDark = theme === "dark";

    return {
        theme,
        isDark,
        toggleTheme: () => toggleTheme(section),
        setTheme: (newTheme) => setSectionTheme(section, newTheme),
        activeSection,
    };
}

export default ThemeContext;
