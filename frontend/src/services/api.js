export const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

export const resolveProfileImageUrl = (profileImage) => {
    if (!profileImage) return null;
    if (/^https?:\/\//i.test(profileImage)) return profileImage;
    const base = API_BASE_URL.replace(/\/+$/, "");
    const path = profileImage.startsWith("/") ? profileImage : `/${profileImage}`;
    return `${base}${path}`;
};

const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");

    const isFormData =
        typeof FormData !== "undefined" && options.body instanceof FormData;

    const headers = {
        ...options.headers
    };

    // Let the browser set multipart boundary for FormData
    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    let data;

    try {
        data = await response.json();
    } catch {
        data = {
            success: false,
            message: "Invalid response from server"
        };
    }

    if (!response.ok) {
        const error = new Error(
            data.message || "Something went wrong"
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
};

export default apiRequest;
