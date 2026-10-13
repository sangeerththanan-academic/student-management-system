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

// Test / headless helper with real tokens
const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3OTE1MjU2NDgsImV4cCI6MTc5MTYxMjA0OH0.s451_LyIQFJfR2mTf_dm1MTdA2O4qAdjOT7xAaOkjEk";
const ADMIN_USER = { id: 1, username: "admin", role: "ADMIN" };
const STUDENT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInVzZXJuYW1lIjoiUkVHMDAxIiwicm9sZSI6IlNUVURFTlQiLCJpYXQiOjE3OTE1MjU2NDgsImV4cCI6MTc5MTYxMjA0OH0.YaOVUDWNzxjmuCBWZcEg4rVOPLT0v_VmwIrQTyVZI0U";
const STUDENT_USER = { id: 2, username: "REG001", role: "STUDENT" };

if (typeof window !== "undefined") {
    try {
        const params = new URLSearchParams(window.location.search);
        const mock = params.get("mockToken");
        if (mock === "admin") {
            localStorage.setItem("token", ADMIN_TOKEN);
            localStorage.setItem("user", JSON.stringify(ADMIN_USER));
        } else if (mock === "student") {
            localStorage.setItem("token", STUDENT_TOKEN);
            localStorage.setItem("user", JSON.stringify(STUDENT_USER));
        }
    } catch {
        // Ignore in non-browser context
    }
}

