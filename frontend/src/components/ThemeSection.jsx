import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "./ThemeToggle";

function ThemeSection({ section, children }) {
    const { getTheme } = useTheme();
    const theme = getTheme(section);

    return (
        <div
            className={`theme-section theme-${theme} section-${section}`}
            data-theme={theme}
        >
            <ThemeToggle section={section} />
            {children}
        </div>
    );
}

export default ThemeSection;
