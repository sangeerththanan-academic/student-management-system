// import apiRequest from "./api";

// // Login
// export const login = async (username, password) => {
//     const data = await apiRequest("/api/auth/login", {
//         method: "POST",
//         body: JSON.stringify({
//             username,
//             password
//         })
//     });

//     // Store JWT
//     if (data.token) {
//         localStorage.setItem("token", data.token);
//     }

//     // Store user information
//     if (data.user) {
//         localStorage.setItem("user", JSON.stringify(data.user));
//     }

//     return data;
// };


// // Get currently logged-in user
// export const getCurrentUser = async () => {
//     return await apiRequest("/api/auth/me", {
//         method: "GET"
//     });
// };


// // Get stored user
// export const getStoredUser = () => {
//     const user = localStorage.getItem("user");

//     if (!user) {
//         return null;
//     }

//     try {
//         return JSON.parse(user);
//     } catch {
//         return null;
//     }
// };


// // Logout
// export const logout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
// };


// // Check whether a token exists
// export const isAuthenticated = () => {
//     return Boolean(localStorage.getItem("token"));
// };



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

// Get currently logged-in user
export const getCurrentUser = async () => {
    return await apiRequest("/api/auth/me", {
        method: "GET"
    });
};

// Request a password reset OTP by email
export const forgotPassword = async (email) => {
    return await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
    });
};

// Verify the OTP received by email
export const verifyResetOtp = async (email, otp) => {
    return await apiRequest("/api/auth/verify-reset-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp })
    });
};

// Reset password after OTP verification
export const resetPassword = async (
    resetToken,
    newPassword,
    confirmPassword
) => {
    return await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
            resetToken,
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
