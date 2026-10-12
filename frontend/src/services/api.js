
const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");

    const headers = {
        ...options.headers
    };

    const isFormData = options.body instanceof FormData;

    // Set JSON Content-Type only for non-FormData requests
    if (!isFormData && options.body !== undefined) {
        headers["Content-Type"] = "application/json";
    } else if (isFormData) {
        delete headers["Content-Type"];
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