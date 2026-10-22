import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    BookOpen,
    Clock,
    Tag,
    Award,
    CheckCircle2,
    AlertCircle,
    X,
    Search,
    Check
} from "lucide-react";

import {
    getStoredUser,
    logout
} from "../services/authService";

import apiRequest from "../services/api";
import ThemeToggle from "../components/ThemeToggle";
import ChangeStudentPassword from "../components/ChangeStudentPassword";
import { useTheme } from "../context/ThemeContext";

import "../styles/studentDashboard.css";

function StudentDashboardPage() {
    const navigate = useNavigate();
    const { theme } = useTheme("student");

    const [user] = useState(getStoredUser());
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // CR-009: Courses & Enrollment State
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [coursesError, setCoursesError] = useState("");
    const [enrollingCourseId, setEnrollingCourseId] = useState(null);
    const [enrollmentSuccess, setEnrollmentSuccess] = useState("");
    const [enrollmentError, setEnrollmentError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Load Student Profile
    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await apiRequest(
                    "/api/students/me",
                    { method: "GET" }
                );

                if (data.student) {
                    setStudent(data.student);
                }
            } catch (err) {
                console.error("Failed to load profile:", err);

                if (err.status === 401) {
                    logout();
                    navigate("/login", { replace: true });
                    return;
                }

                setError(
                    err.message || "Failed to load your profile."
                );
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [navigate]);

    // CR-009: Load Available Courses
    const loadCourses = async () => {
        try {
            setCoursesLoading(true);
            setCoursesError("");

            const data = await apiRequest("/api/courses", { method: "GET" });

            if (data.courses) {
                setCourses(data.courses);
            }
        } catch (err) {
            console.error("Failed to load courses:", err);
            setCoursesError(err.message || "Failed to load available courses.");
        } finally {
            setCoursesLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
    }, []);

    // CR-009: Handle Course Enrollment
    const handleEnroll = async (course) => {
        try {
            setEnrollingCourseId(course.course_id);
            setEnrollmentError("");
            setEnrollmentSuccess("");

            const response = await apiRequest("/api/enrollments", {
                method: "POST",
                body: JSON.stringify({ courseId: course.course_id })
            });

            setEnrollmentSuccess(
                response.message || `Successfully enrolled in ${course.title}!`
            );

            // Update course enrolled status in local state
            setCourses((prevCourses) =>
                prevCourses.map((c) =>
                    c.course_id === course.course_id
                        ? { ...c, is_enrolled: 1 }
                        : c
                )
            );
        } catch (err) {
            console.error("Course enrollment failed:", err);
            setEnrollmentError(
                err.message || "Failed to enroll in the selected course."
            );
        } finally {
            setEnrollingCourseId(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    // Filter categories dynamically
    const categories = useMemo(() => {
        const set = new Set(courses.map((c) => c.category));
        return ["All", ...Array.from(set)];
    }, [courses]);

    // Filter courses by search and category
    const filteredCourses = useMemo(() => {
        return courses.filter((c) => {
            const matchesCategory =
                selectedCategory === "All" || c.category === selectedCategory;
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch =
                query === "" ||
                c.title?.toLowerCase().includes(query) ||
                c.category?.toLowerCase().includes(query) ||
                c.course_code?.toLowerCase().includes(query) ||
                c.description?.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
    }, [courses, selectedCategory, searchQuery]);

    return (
        <div className={`student-dashboard-page ${theme}`} data-theme={theme}>
            {/* Header */}
            <header className="student-dashboard-header">
                <div>
                    <h1>Student Portal</h1>
                    <p>Welcome, {user?.username}</p>
                </div>

                <div className="student-header-actions">
                    <span className="role-badge">STUDENT</span>
                    <ThemeToggle section="student" showLabel={true} />
                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="student-dashboard-main">
                {/* Profile Section */}
                <section className="dashboard-section">
                    <h2 className="section-title">My Profile</h2>

                    {error && (
                        <div className="student-error">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="student-loading">
                            Loading your profile...
                        </div>
                    ) : student ? (
                        <div className="profile-card">
                            <div className="profile-header">
                                {/* CR-010: Display student profile image or initials avatar */}
                                {student.profile_photo ? (
                                    <img
                                        src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${student.profile_photo}`}
                                        alt={`${student.first_name} ${student.last_name}`}
                                        className="profile-avatar-img"
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                            const fallback = e.currentTarget.parentElement?.querySelector(".profile-avatar");
                                            if (fallback) fallback.style.display = "flex";
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="profile-avatar"
                                    style={{ display: student.profile_photo ? "none" : "flex" }}
                                >
                                    {student.first_name?.charAt(0)}
                                    {student.last_name?.charAt(0)}
                                </div>
                                <div className="profile-name">
                                    <h3>
                                        {student.first_name} {student.last_name}
                                    </h3>
                                    <p>{student.registration_no}</p>
                                </div>
                            </div>

                            <div className="profile-details">
                                <div className="detail-row">
                                    <span className="detail-label">
                                        Registration No
                                    </span>
                                    <span className="detail-value">
                                        {student.registration_no}
                                    </span>
                                </div>

                                <div className="detail-row">
                                    <span className="detail-label">
                                        Full Name
                                    </span>
                                    <span className="detail-value">
                                        {student.first_name} {student.last_name}
                                    </span>
                                </div>

                                <div className="detail-row">
                                    <span className="detail-label">
                                        Email
                                    </span>
                                    <span className="detail-value">
                                        {student.email}
                                    </span>
                                </div>

                                <div className="detail-row">
                                    <span className="detail-label">
                                        Phone
                                    </span>
                                    <span className="detail-value">
                                        {student.phone_number}
                                    </span>
                                </div>

                                <div className="detail-row">
                                    <span className="detail-label">
                                        Member Since
                                    </span>
                                    <span className="detail-value">
                                        {new Date(
                                            student.created_at
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        !error && (
                            <div className="student-loading">
                                No profile data found.
                            </div>
                        )
                    )}
                </section>

                {/* CR-009: Available Courses Section */}
                <section className="dashboard-section student-courses-section">
                    <div className="courses-section-header">
                        <div className="courses-title-group">
                            <div className="courses-title-badge">
                                <BookOpen size={20} className="courses-title-icon" />
                                <h2 className="section-title">Available Courses</h2>
                            </div>
                            <p className="courses-subtitle">
                                Browse available courses and enroll directly from your student portal.
                            </p>
                        </div>
                        <span className="courses-count-pill">
                            {courses.length} {courses.length === 1 ? "Course" : "Courses"}
                        </span>
                    </div>

                    {/* Enrollment Feedback Messages */}
                    {enrollmentSuccess && (
                        <div className="course-alert course-alert-success" role="alert">
                            <div className="course-alert-content">
                                <CheckCircle2 size={18} className="course-alert-icon" />
                                <span>{enrollmentSuccess}</span>
                            </div>
                            <button
                                className="course-alert-dismiss"
                                onClick={() => setEnrollmentSuccess("")}
                                aria-label="Dismiss alert"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {enrollmentError && (
                        <div className="course-alert course-alert-error" role="alert">
                            <div className="course-alert-content">
                                <AlertCircle size={18} className="course-alert-icon" />
                                <span>{enrollmentError}</span>
                            </div>
                            <button
                                className="course-alert-dismiss"
                                onClick={() => setEnrollmentError("")}
                                aria-label="Dismiss alert"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Search & Category Filter Bar */}
                    <div className="courses-filter-bar">
                        <div className="course-search-wrapper">
                            <Search size={16} className="course-search-icon" />
                            <input
                                type="text"
                                className="course-search-input"
                                placeholder="Search courses by title, topic, or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    className="course-search-clear"
                                    onClick={() => setSearchQuery("")}
                                    title="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {categories.length > 2 && (
                            <div className="course-category-chips">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        className={`category-chip ${selectedCategory === cat ? "active" : ""}`}
                                        onClick={() => setSelectedCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Courses Listing */}
                    {coursesLoading ? (
                        <div className="student-loading">
                            Loading available courses...
                        </div>
                    ) : coursesError ? (
                        <div className="student-error">
                            {coursesError}
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="courses-empty-state">
                            <BookOpen size={40} className="empty-state-icon" />
                            <p className="empty-state-title">No courses found</p>
                            <p className="empty-state-desc">
                                {searchQuery || selectedCategory !== "All"
                                    ? "Try adjusting your search criteria or filter."
                                    : "There are currently no courses available for enrollment."}
                            </p>
                        </div>
                    ) : (
                        <div className="courses-grid">
                            {filteredCourses.map((course) => {
                                const isEnrolled = Boolean(course.is_enrolled);
                                const isEnrolling = enrollingCourseId === course.course_id;

                                return (
                                    <div
                                        key={course.course_id}
                                        className={`course-card ${isEnrolled ? "course-card-enrolled" : ""}`}
                                    >
                                        <div className="course-card-top">
                                            <div className="course-badges">
                                                <span className="course-category-badge">
                                                    <Tag size={12} />
                                                    {course.category}
                                                </span>
                                                <span className={`course-level-badge level-${course.level?.toLowerCase()}`}>
                                                    <Award size={12} />
                                                    {course.level}
                                                </span>
                                            </div>
                                            <span className="course-code-pill">
                                                {course.course_code}
                                            </span>
                                        </div>

                                        <h3 className="course-title">
                                            {course.title}
                                        </h3>

                                        {course.description && (
                                            <p className="course-description">
                                                {course.description}
                                            </p>
                                        )}

                                        <div className="course-metadata-row">
                                            <div className="course-meta-item">
                                                <Clock size={14} className="meta-icon" />
                                                <span className="meta-label">Duration:</span>
                                                <span className="meta-value">{course.duration}</span>
                                            </div>

                                            <div className="course-meta-item">
                                                <span className="meta-label">Price:</span>
                                                <span className="course-price-tag">
                                                    {parseFloat(course.price) === 0
                                                        ? "Free"
                                                        : `$${parseFloat(course.price).toFixed(2)}`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="course-card-actions">
                                            {isEnrolled ? (
                                                <button
                                                    className="course-enroll-btn enrolled-btn"
                                                    disabled
                                                    title="You are currently enrolled in this course"
                                                >
                                                    <Check size={16} />
                                                    Enrolled
                                                </button>
                                            ) : (
                                                <button
                                                    className={`course-enroll-btn ${isEnrolling ? "btn-enrolling" : ""}`}
                                                    onClick={() => handleEnroll(course)}
                                                    disabled={isEnrolling}
                                                >
                                                    {isEnrolling ? "Enrolling..." : "Enroll Now"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* CR-020: Change Password section */}
                <section className="dashboard-section">
                    <ChangeStudentPassword />
                </section>
            </main>
        </div>
    );
}

export default StudentDashboardPage;