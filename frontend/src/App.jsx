import AppRoutes from "./routes/AppRoutes";
import ThemeToggle from "./components/ThemeToggle";

function App() {
    return (
        <>
            <div className="app-theme-control">
                <ThemeToggle />
            </div>
            <AppRoutes />
        </>
    );
}

export default App;
