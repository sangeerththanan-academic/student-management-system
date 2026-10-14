import apiRequest from "./api";


// ==========================================
// LOGIN
// ==========================================

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
        localStorage.setItem(
            "user",
            JSON.stringify(data.user)
        );
    }

    return data;
};


// ==========================================
// FORGOT PASSWORD
// ==========================================

export const forgotPassword = async (email) => {
    return await apiRequest(
        "/api/auth/forgot-password",
        {
            method: "POST",
            body: JSON.stringify({
                email
            })
        }
    );
};


// ==========================================
// RESET PASSWORD
// ==========================================

export const resetPassword = async (
    token,
    password,
    confirmPassword
) => {
    return await apiRequest(
        "/api/auth/reset-password",
        {
            method: "POST",
            body: JSON.stringify({
                token,
                password,
                confirmPassword
            })
        }
    );
};


// ==========================================
// GET CURRENT USER
// ==========================================

export const getCurrentUser = async () => {
    return await apiRequest(
        "/api/auth/me",
        {
            method: "GET"
        }
    );
};


// ==========================================
// GET STORED USER
// ==========================================

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


// ==========================================
// LOGOUT
// ==========================================

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};


// ==========================================
// AUTHENTICATION CHECK
// ==========================================

export const isAuthenticated = () => {
    return Boolean(
        localStorage.getItem("token")
    );
};
