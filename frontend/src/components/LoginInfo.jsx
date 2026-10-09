
import { GraduationCap } from "lucide-react";

function LoginInfo({ onBack }) {
    return (
        <section className="login-info">
            <button
                type="button"
                className="back-button"
                onClick={onBack}
            >
                ← Back to Home
            </button>

            <div className="login-info-content">
                <div className="login-logo">
                    <GraduationCap size={60} />
                </div>

                <h1>
                    Student Management System
                </h1>

                <p>
                    Manage student accounts, profiles,
                    and academic information from one
                    secure administrator dashboard.
                </p>
            </div>
        </section>
    );
}

export default LoginInfo;

