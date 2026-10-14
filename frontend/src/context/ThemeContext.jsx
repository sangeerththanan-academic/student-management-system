import { useState } from "react";

import { ThemeContext } from "./themeContextValue";

const themeStorageKey = "sms-theme";
const legacyThemeStorageKeys = [
    "sms-theme-home",
    "sms-theme-login",
    "sms-theme-admin",
    "sms-theme-student"
];

const readTheme = () => {
    try {
        const savedTheme = localStorage.getItem(themeStorageKey);
        if (savedTheme === "dark" || savedTheme === "light") {
            return savedTheme;
        }

        return legacyThemeStorageKeys.some(
            (storageKey) => localStorage.getItem(storageKey) === "dark"
        ) ? "dark" : "light";
    } catch (error) {
        console.error("Unable to read the theme preference:", error);
        return "light";
    }
};

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(readTheme);

    const setTheme = (nextTheme) => {
        setThemeState(nextTheme);

        try {
            localStorage.setItem(themeStorageKey, nextTheme);
        } catch (error) {
            console.error("Unable to save the theme preference:", error);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
