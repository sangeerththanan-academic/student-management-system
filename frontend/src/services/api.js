const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

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

export const downloadFile = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
        ...options.headers
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        let message = "Unable to download the file";

        try {
            const data = await response.json();
            message = data.message || message;
        } catch {
            // Keep the generic message when the server returns a non-JSON error.
        }

        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return response.blob();
};

export default apiRequest;
