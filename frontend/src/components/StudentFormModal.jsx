import { useEffect, useState } from "react";
import apiRequest from "../services/api";
import { parseStudentCSV } from "../utils/csvStudentImport";

const EMPTY_FORM = {
registrationNo: "",
firstName: "",
lastName: "",
email: "",
phoneNumber: "",
password: ""
};

const getProfileImageUrl = (profileImage) => {
if (!profileImage) return "";

if (
    profileImage.startsWith("http://") ||
    profileImage.startsWith("https://")
) {
    return profileImage;
}

const apiBaseUrl = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

if (profileImage.startsWith("/")) {
    return `${apiBaseUrl}${profileImage}`;
}

return `${apiBaseUrl}/uploads/students/${profileImage}`;
```

};

function StudentFormModal({
show,
editingStudent,
onClose,
onSuccess,
onAuthError
}) {
const [formData, setFormData] = useState({ ...EMPTY_FORM });

```
const [formLoading, setFormLoading] = useState(false);
const [formError, setFormError] = useState("");

const [profileImage, setProfileImage] = useState(null);
const [imageError, setImageError] = useState("");
const [imagePreview, setImagePreview] = useState("");

// CSV import state
const [importedStudents, setImportedStudents] = useState([]);
const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
const [savedIndexes, setSavedIndexes] = useState([]);
const [csvError, setCsvError] = useState("");
const [csvMessage, setCsvMessage] = useState("");
const [csvLoading, setCsvLoading] = useState(false);

const isCSVMode = !editingStudent && importedStudents.length > 0;
const currentStudentSaved =
    isCSVMode && savedIndexes.includes(selectedStudentIndex);

// Load the selected student when the modal opens.
useEffect(() => {
    if (!show) return;

    setFormError("");
    setImageError("");
    setProfileImage(null);

    setImportedStudents([]);
    setSelectedStudentIndex(0);
    setSavedIndexes([]);
    setCsvError("");
    setCsvMessage("");
    setCsvLoading(false);

    if (editingStudent) {
        setFormData({
            registrationNo: editingStudent.registration_no || "",
            firstName: editingStudent.first_name || "",
            lastName: editingStudent.last_name || "",
            email: editingStudent.email || "",
            phoneNumber: editingStudent.phone_number || "",
            password: ""
        });

        setImagePreview(
            getProfileImageUrl(editingStudent.profile_image)
        );
    } else {
        setFormData({ ...EMPTY_FORM });
        setImagePreview("");
    }
}, [editingStudent, show]);

// Release temporary image preview URLs.
useEffect(() => {
    if (!imagePreview || !imagePreview.startsWith("blob:")) {
        return undefined;
    }

    return () => {
        URL.revokeObjectURL(imagePreview);
    };
}, [imagePreview]);

const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
        ...previous,
        [name]: value
    }));
};

const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    setProfileImage(null);
    setImageError("");

    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg"];
    const allowedExtensions = /\.(png|jpe?g)$/i;

    if (
        !allowedTypes.includes(file.type) ||
        !allowedExtensions.test(file.name)
    ) {
        setImageError(
            "Only PNG, JPG and JPEG images are allowed."
        );
        event.target.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        setImageError("Image size must not exceed 2 MB.");
        event.target.value = "";
        return;
    }

    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
};

const handleCSVUpload = async (event) => {
    const file = event.target.files?.[0];

    setCsvError("");
    setCsvMessage("");

    if (!file) return;

    try {
        setCsvLoading(true);

        const students = await parseStudentCSV(file);

        setImportedStudents(students);
        setSelectedStudentIndex(0);
        setSavedIndexes([]);

        setFormData({
            ...EMPTY_FORM,
            ...students[0]
        });

        setProfileImage(null);
        setImagePreview("");
        setImageError("");
        setFormError("");

        setCsvMessage(
            `${students.length} student record(s) imported. Review each record and save it individually.`
        );
    } catch (error) {
        setCsvError(error.message || "Unable to import the CSV file.");
    } finally {
        setCsvLoading(false);
        event.target.value = "";
    }
};

// Preserve edits when moving between imported CSV records.
const goToImportedStudent = (nextIndex) => {
    if (
        nextIndex < 0 ||
        nextIndex >= importedStudents.length ||
        nextIndex === selectedStudentIndex
    ) {
        return;
    }

    setImportedStudents((previous) =>
        previous.map((student, index) =>
            index === selectedStudentIndex
                ? { ...student, ...formData }
                : student
        )
    );

    const nextStudent = importedStudents[nextIndex];

    setSelectedStudentIndex(nextIndex);
    setFormData({
        ...EMPTY_FORM,
        ...nextStudent
    });

    setProfileImage(null);
    setImagePreview("");
    setImageError("");
    setFormError("");
};

const handleClose = () => {
    if (formLoading || csvLoading) return;

    setFormError("");
    setImageError("");
    setProfileImage(null);
    setImagePreview("");
    setImportedStudents([]);
    setSavedIndexes([]);
    setCsvError("");
    setCsvMessage("");

    onClose();
};

const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (currentStudentSaved) {
        setFormError("This CSV student has already been saved.");
        return;
    }

    if (
        !formData.registrationNo.trim() ||
        !formData.firstName.trim() ||
        !formData.lastName.trim() ||
        !formData.email.trim() ||
        !formData.phoneNumber.trim()
    ) {
        setFormError("All student fields are required.");
        return;
    }

    if (!editingStudent && !formData.password.trim()) {
        setFormError(
            "Password is required for a new student. Enter a password for this student."
        );
        return;
    }

    if (imageError) {
        setFormError("Please select a valid profile image.");
        return;
    }

    try {
        setFormLoading(true);

        const studentData = new FormData();

        studentData.append(
            "registrationNo",
            formData.registrationNo.trim()
        );
        studentData.append("firstName", formData.firstName.trim());
        studentData.append("lastName", formData.lastName.trim());
        studentData.append("email", formData.email.trim());
        studentData.append("phoneNumber", formData.phoneNumber.trim());

        if (!editingStudent) {
            studentData.append("password", formData.password);
        }

        if (profileImage) {
            studentData.append("profileImage", profileImage);
        }

        // Use the existing API. No bulk insert endpoint is added.
        await apiRequest(
            editingStudent
                ? `/api/students/${editingStudent.student_id}`
                : "/api/students/",
            {
                method: editingStudent ? "PUT" : "POST",
                body: studentData
            }
        );

        if (isCSVMode) {
            // Preserve this student's final form values.
            setImportedStudents((previous) =>
                previous.map((student, index) =>
                    index === selectedStudentIndex
                        ? { ...student, ...formData }
                        : student
                )
            );

            const updatedSavedIndexes = [
                ...new Set([...savedIndexes, selectedStudentIndex])
            ];

            setSavedIndexes(updatedSavedIndexes);

            const nextUnsavedIndex = importedStudents.findIndex(
                (_, index) => !updatedSavedIndexes.includes(index)
            );

            if (nextUnsavedIndex !== -1) {
                const nextStudent = importedStudents[nextUnsavedIndex];

                setSelectedStudentIndex(nextUnsavedIndex);
                setFormData({
                    ...EMPTY_FORM,
                    ...nextStudent
                });

                setProfileImage(null);
                setImagePreview("");
                setImageError("");
                setFormError("");

                setCsvMessage(
                    `Saved ${updatedSavedIndexes.length} of ${importedStudents.length} students. Continue reviewing the next student.`
                );
                return;
            }

            setCsvMessage(
                `All ${importedStudents.length} student records have been saved.`
            );

            await onSuccess();
            onClose();
            return;
        }

        await onSuccess();
        onClose();
    } catch (error) {
        console.error("Student save error:", error);

        if (error.status === 401) {
            onAuthError();
            return;
        }

        if (error.status === 403) {
            setFormError(
                "You do not have permission to modify students."
            );
            return;
        }

        setFormError(error.message || "Failed to save student.");
    } finally {
        setFormLoading(false);
    }
};

if (!show) return null;

return (
    <div className="modal-overlay" onClick={handleClose}>
        <div
            className="modal-content student-form-card"
            onClick={(event) => event.stopPropagation()}
        >
            <div className="form-card-header">
                <div>
                    <h3>
                        {editingStudent ? "Edit Student" : "Add New Student"}
                    </h3>

                    <p>
                        {editingStudent
                            ? "Update student information and profile image."
                            : "Create a new student account or import student details from a CSV file."}
                    </p>
                </div>

                <button
                    type="button"
                    className="close-form-button"
                    onClick={handleClose}
                    disabled={formLoading || csvLoading}
                    aria-label="Close form"
                >
                    ×
                </button>
            </div>

            {!editingStudent && (
                <section className="csv-import-section">
                    <h4>Import Students from CSV</h4>

                    <p>
                        Upload one CSV file containing multiple student
                        records. Review and save each student separately.
                    </p>

                    <p className="csv-format-help">
                        Required columns: registrationNo, firstName,
                        lastName, email, phoneNumber
                    </p>

                    <label htmlFor="studentCSV">Choose CSV file</label>

                    <input
                        id="studentCSV"
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleCSVUpload}
                        disabled={formLoading || csvLoading}
                    />

                    {csvLoading && (
                        <p role="status">Reading CSV file...</p>
                    )}

                    {csvError && (
                        <p className="csv-import-error" role="alert">
                            {csvError}
                        </p>
                    )}

                    {csvMessage && (
                        <p className="csv-import-success" role="status">
                            {csvMessage}
                        </p>
                    )}

                    {isCSVMode && (
                        <div className="csv-student-navigation">
                            <p>
                                Student {selectedStudentIndex + 1} of{" "}
                                {importedStudents.length}
                            </p>

                            <p>
                                Status:{" "}
                                {currentStudentSaved ? "Saved" : "Not saved"}
                            </p>

                            <div className="csv-navigation-buttons">
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() =>
                                        goToImportedStudent(
                                            selectedStudentIndex - 1
                                        )
                                    }
                                    disabled={
                                        formLoading ||
                                        selectedStudentIndex === 0
                                    }
                                >
                                    Previous
                                </button>

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() =>
                                        goToImportedStudent(
                                            selectedStudentIndex + 1
                                        )
                                    }
                                    disabled={
                                        formLoading ||
                                        selectedStudentIndex ===
                                            importedStudents.length - 1
                                    }
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {formError && (
                <div className="dashboard-error" role="alert">
                    {formError}
                </div>
            )}

            <form className="student-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="registrationNo">
                        Registration Number
                    </label>
                    <input
                        id="registrationNo"
                        name="registrationNo"
                        type="text"
                        value={formData.registrationNo}
                        onChange={handleInputChange}
                        disabled={formLoading || currentStudentSaved}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        disabled={formLoading || currentStudentSaved}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        disabled={formLoading || currentStudentSaved}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={formLoading || currentStudentSaved}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phoneNumber">Phone Number</label>
                    <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="text"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        disabled={formLoading || currentStudentSaved}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="profileImage">Profile Image</label>
                    <input
                        id="profileImage"
                        type="file"
                        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                        onChange={handleImageChange}
                        disabled={formLoading || currentStudentSaved}
                    />

                    <small>
                        PNG, JPG or JPEG. Maximum size: 2 MB.
                        {editingStudent
                            ? " Choose a new image to replace the current one."
                            : " Image is optional."}
                    </small>

                    {imageError && (
                        <p className="image-validation-error" role="alert">
                            {imageError}
                        </p>
                    )}

                    {imagePreview && (
                        <div className="profile-image-preview">
                            <img
                                src={imagePreview}
                                alt="Student profile preview"
                                width="120"
                                height="120"
                                style={{
                                    objectFit: "cover",
                                    borderRadius: "50%"
                                }}
                                onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                }}
                            />

                            {profileImage && <p>{profileImage.name}</p>}
                        </div>
                    )}
                </div>

                {!editingStudent && (
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            disabled={formLoading || currentStudentSaved}
                            autoComplete="new-password"
                            required
                        />

                        <small>
                            Enter a password for this student. Passwords
                            are not imported from the CSV file.
                        </small>
                    </div>
                )}

                <div className="form-actions">
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={handleClose}
                        disabled={formLoading || csvLoading}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="save-button"
                        disabled={
                            formLoading ||
                            csvLoading ||
                            currentStudentSaved
                        }
                    >
                        {formLoading
                            ? "Saving..."
                            : currentStudentSaved
                              ? "Student Saved"
                              : editingStudent
                                ? "Update Student"
                                : isCSVMode
                                  ? "Save This Student"
                                  : "Create Student"}
                    </button>
                </div>
            </form>
        </div>
    </div>
);


}

export default StudentFormModal;
