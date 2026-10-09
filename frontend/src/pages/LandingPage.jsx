
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "../styles/landing.css";

import {
    GraduationCap,
    ShieldCheck,
    Users,
    Database
} from "lucide-react";

function LandingPage() {
    return (
        <div className="landing-page">

            {/* Navigation */}
            <Navbar />

            <main>

                {/* Hero Section */}
                <section
                    className="hero-section"
                    id="home"
                >
                    <div className="hero-container">

                        <div className="hero-content">

                            <span className="hero-badge">
                                ABC Institute
                            </span>

                            <h1>
                                Student Management
                                <span> System</span>
                            </h1>

                            <p>
                                A modern and secure platform for
                                managing student information efficiently.
                            </p>

                            <div className="hero-actions">

                                <Link
                                    to="/login"
                                    className="primary-button"
                                >
                                    Login to System
                                </Link>

                                <a
                                    href="#features"
                                    className="secondary-button"
                                >
                                    Explore Features
                                </a>

                            </div>

                        </div>

                        <div className="hero-card">

                            <div className="hero-card-icon">
                                <GraduationCap size={40} />
                            </div>

                            <h2>
                                Manage Students
                            </h2>

                            <p>
                                Manage student profiles, accounts,
                                and academic information from one place.
                            </p>

                            <div className="hero-card-stats">

                                <div>
                                    <strong>Secure</strong>
                                    <span>Authentication</span>
                                </div>

                                <div>
                                    <strong>Easy</strong>
                                    <span>Management</span>
                                </div>

                            </div>

                        </div>

                    </div>
                </section>

                {/* About Section */}
                <section
                    className="about-section"
                    id="about"
                >
                    <div className="section-container">

                        <div className="section-heading">

                            <span className="section-label">
                                About System
                            </span>

                            <h2>
                                Everything you need to manage students
                            </h2>

                            <p>
                                The Student Management System provides
                                administrators with a centralized platform
                                to manage student records and accounts.
                            </p>

                        </div>

                    </div>
                </section>

                {/* Features Section */}
                <section
                    className="features-section"
                    id="features"
                >
                    <div className="section-container">

                        <div className="section-heading">

                            <span className="section-label">
                                Features
                            </span>

                            <h2>
                                Powerful and simple
                            </h2>

                        </div>

                        <div className="features-grid">

                            {/* Feature 1 */}
                            <div className="feature-card">

                                <div className="feature-icon">
                                    <ShieldCheck size={32} />
                                </div>

                                <h3>
                                    Secure Authentication
                                </h3>

                                <p>
                                    Secure login with JWT-based
                                    authentication and role-based access.
                                </p>

                            </div>

                            {/* Feature 2 */}
                            <div className="feature-card">

                                <div className="feature-icon">
                                    <Users size={32} />
                                </div>

                                <h3>
                                    Student Management
                                </h3>

                                <p>
                                    Create, view, update and delete
                                    student records efficiently.
                                </p>

                            </div>

                            {/* Feature 3 */}
                            <div className="feature-card">

                                <div className="feature-icon">
                                    <Database size={32} />
                                </div>

                                <h3>
                                    Centralized Information
                                </h3>

                                <p>
                                    Keep student information organized
                                    in a centralized database.
                                </p>

                            </div>

                        </div>

                    </div>
                </section>

            </main>

            {/* Footer */}
            <Footer />

        </div>
    );
}

export default LandingPage;
