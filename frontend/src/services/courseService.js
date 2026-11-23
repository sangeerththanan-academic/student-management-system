import apiRequest from "./api";

// GET ALL COURSES
export const getCourses = async () => {
    return await apiRequest("/api/courses", {
        method: "GET"
    });
};

// CREATE COURSE
export const createCourse = async (courseData) => {
    return await apiRequest("/api/courses", {
        method: "POST",
        body: JSON.stringify(courseData)
    });
};

// GET COURSE BY ID
export const getCourseById = async (courseId) => {
    return await apiRequest(`/api/courses/${courseId}`, {
        method: "GET"
    });
};

export default {
    getCourses,
    createCourse,
    getCourseById
};

