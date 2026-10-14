import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role }) {

    const token = localStorage.getItem("token");

    if (!token) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    // If a specific role is required, check the stored user's role
    if (role) {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            return (
                <Navigate
                    to="/login"
                    replace
                />
            );
        }

        let user;

        try {
            user = JSON.parse(storedUser);
        } catch {
            return (
                <Navigate
                    to="/login"
                    replace
                />
            );
        }

        if (user.role !== role) {
            return (
                <Navigate
                    to="/login"
                    replace
                />
            );
        }
    }

    return children;
}

export default ProtectedRoute;
