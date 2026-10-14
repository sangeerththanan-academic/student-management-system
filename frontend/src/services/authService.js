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

    if (data.token) {
        localStorage.setItem("token", data.token);
    }

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


// Check authentication
export const isAuthenticated = () => {
    return Boolean(localStorage.getItem("token"));
};


// Request OTP
export const requestPasswordOTP = async (email) => {
    return await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
            email
        })
    });
};


// Verify OTP
export const verifyPasswordOTP = async (email, otp) => {
    return await apiRequest("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
            email,
            otp
        })
    });
};


// Reset password without a reset token
export const resetPassword = async ({
    email,
    otp,
    newPassword,
    confirmPassword
}) => {
    return await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
            email,
            otp,
            newPassword,
            confirmPassword
        })
    });
};