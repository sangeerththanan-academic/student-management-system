import apiRequest from "./api";

export const getCourses = () => apiRequest("/api/courses", { method: "GET" });

export const createCourse = (course) => apiRequest("/api/courses", {
    method: "POST",
    body: JSON.stringify(course)
});
