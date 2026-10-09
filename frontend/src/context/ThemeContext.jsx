
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "system-theme";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === "dark" || saved === "light" ? saved : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Theme switching still works if storage is unavailable.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
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