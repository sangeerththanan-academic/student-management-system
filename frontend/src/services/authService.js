import apiRequest from "./api";

// Login
export const login = async (username, password) => {
    const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
            username,
            password
        })
    });

    // Store JWT
    if (data.token) {
        localStorage.setItem("token", data.token);
    }

    // Store user information
    if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
};


// Get currently logged-in user
export const getCurrentUser = async () => {
    return await apiRequest("/api/auth/me", {
        method: "GET"
    });
};

export const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    return await apiRequest("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
            oldPassword,
            newPassword,
            confirmPassword
        })
    });
};


// Get stored user
export const getStoredUser = () => {
    const user = localStorage.getItem("user");

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch {
        return null;
    }
};


// Logout
export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};


// Check whether a token exists
export const isAuthenticated = () => {
    return Boolean(localStorage.getItem("token"));
};
