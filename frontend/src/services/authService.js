import apiRequest from "./api";

// Login
export const login = async (username, password) => {
    const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
    });

    if (data.token) {
        localStorage.setItem("token", data.token);
    }

    if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
};

// Request a password-reset OTP by email.
export const forgotPassword = async (email) => {
    return await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
    });
};

// Verify the emailed OTP and set the new password.
export const resetPassword = async (email, otp, password, confirmPassword) => {
    return await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
            email,
            otp,
            password,
            confirmPassword
        })
    });
};

// Get currently logged-in user
export const getCurrentUser = async () => {
    return await apiRequest("/api/auth/me", {
        method: "GET"
    });
};

// Get stored user
export const getStoredUser = () => {
    const user = localStorage.getItem("user");

    if (!user) return null;

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
