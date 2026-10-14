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
// VERIFY OTP
// ==========================================

export const verifyOtp = async (email, otp) => {
    return await apiRequest(
        "/api/auth/verify-otp",
        {
            method: "POST",
            body: JSON.stringify({
                email,
                otp
            })
        }
    );
};


// ==========================================
// RESET PASSWORD
// Supports both ({ email, otp, password, confirmPassword })
// and legacy (token, password, confirmPassword)
// ==========================================

export const resetPassword = async (arg1, arg2, arg3, arg4) => {
    let payload = {};

    if (typeof arg1 === "object" && arg1 !== null) {
        payload = arg1;
    } else if (arg4 !== undefined) {
        payload = {
            email: arg1,
            otp: arg2,
            password: arg3,
            confirmPassword: arg4
        };
    } else {
        payload = {
            token: arg1,
            password: arg2,
            confirmPassword: arg3
        };
    }

    return await apiRequest(
        "/api/auth/reset-password",
        {
            method: "POST",
            body: JSON.stringify(payload)
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
