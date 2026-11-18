import { useState, useRef, useId } from "react";
import {
    Upload,
    FileSpreadsheet,
    Download,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Trash2,
    Edit3,
    Check,
    X,
    RefreshCw
} from "lucide-react";

import apiRequest from "../services/api";
import { triggerCsvDownload } from "../utils/csvExport";
import {
    parseCsvContent,
    validateHeaders,
    validateStudentDataRow,
    generateSampleCsvTemplate,
    REQUIRED_FIELDS,
    DEFAULT_STUDENT_PASSWORD
} from "../utils/csvImport";

export default function StudentImportModal({
    show,
    existingStudents = [],
    onClose,
    onSuccess,
    onAuthError
}) {
    const fileInputId = useId();
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [fileSize, setFileSize] = useState(0);

    const [isDragging, setIsDragging] = useState(false);
    const [parseError, setParseError] = useState("");
    const [isParsing, setIsParsing] = useState(false);

    // Parsed records: array of { id, registrationNo, firstName, lastName, email, phoneNumber, password, isValid, errors }
    const [studentsData, setStudentsData] = useState([]);
    const [editingRowId, setEditingRowId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    // Import progress and submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    if (!show) return null;

    // Reset all internal state
    const handleReset = () => {
        setFile(null);
        setFileName("");
        setFileSize(0);
        setParseError("");
        setSubmitError("");
        setStudentsData([]);
        setEditingRowId(null);
        setEditFormData({});
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    // Download CSV template
    const handleDownloadTemplate = () => {
        const csvContent = generateSampleCsvTemplate();
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "student_import_template.csv");
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
    };

    // Process a selected or dropped file
    const processFile = (selectedFile) => {
        setParseError("");
        setSubmitError("");
        setStudentsData([]);

        if (!selectedFile) return;

        // Check file extension
        const name = selectedFile.name || "";
        const isCsv = name.toLowerCase().endsWith(".csv") || selectedFile.type === "text/csv" || selectedFile.type === "application/vnd.ms-excel";
        if (!isCsv) {
            setParseError("Invalid file type. Please upload a valid CSV file (.csv).");
            return;
        }

        // Check file size (5MB limit)
        if (selectedFile.size > 5 * 1024 * 1024) {
            setParseError("File size exceeds 5MB limit. Please upload a smaller CSV file.");
            return;
        }

        setFile(selectedFile);
        setFileName(selectedFile.name);
        setFileSize(selectedFile.size);
        setIsParsing(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const rows = parseCsvContent(text);

                if (!rows || rows.length === 0) {
                    setParseError("The uploaded CSV file is empty.");
                    setIsParsing(false);
                    return;
                }

                const headerRow = rows[0];
                const headerValidation = validateHeaders(headerRow);

                if (!headerValidation.isValid) {
                    const missingLabels = headerValidation.missingFields.map((f) => f.label).join(", ");
                    setParseError(`Missing required CSV column(s): ${missingLabels}. Please review your CSV header row or download the template.`);
                    setIsParsing(false);
                    return;
                }

                const dataRows = rows.slice(1);
                if (dataRows.length === 0) {
                    setParseError("The CSV file contains only headers and no student data rows.");
                    setIsParsing(false);
                    return;
                }

                // Map raw row values into raw student objects
                const rawStudents = dataRows.map((row, idx) => {
                    const studentObj = {
                        id: `row-${idx + 1}`,
                        registrationNo: (row[headerValidation.fieldIndexMap.registrationNo] || "").trim(),
                        firstName: (row[headerValidation.fieldIndexMap.firstName] || "").trim(),
                        lastName: (row[headerValidation.fieldIndexMap.lastName] || "").trim(),
                        email: (row[headerValidation.fieldIndexMap.email] || "").trim(),
                        phoneNumber: (row[headerValidation.fieldIndexMap.phoneNumber] || "").trim(),
                        password: headerValidation.fieldIndexMap.password !== undefined
                            ? (row[headerValidation.fieldIndexMap.password] || "").trim()
                            : ""
                    };
                    return studentObj;
                });

                // Validate all rows
                const validatedList = rawStudents.map((st) => {
                    const result = validateStudentDataRow(st, existingStudents, rawStudents);
                    return {
                        id: st.id,
                        ...result.normalizedStudent,
                        isValid: result.isValid,
                        errors: result.errors
                    };
                });

                setStudentsData(validatedList);
            } catch (err) {
                console.error("CSV parse error:", err);
                setParseError("Failed to parse the CSV file. Please ensure it is a properly formatted CSV.");
            } finally {
                setIsParsing(false);
            }
        };

        reader.onerror = () => {
            setParseError("An error occurred while reading the file.");
            setIsParsing(false);
        };

        reader.readAsText(selectedFile);
    };

    // Drag and drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    // Row deletion from preview
    const handleDeleteRow = (id) => {
        setStudentsData((prev) => {
            const next = prev.filter((r) => r.id !== id);
            // Re-validate remaining to clear any batch duplicates resolved by removal
            return next.map((st) => {
                const res = validateStudentDataRow(st, existingStudents, next);
                return {
                    ...st,
                    isValid: res.isValid,
                    errors: res.errors
                };
            });
        });
    };

    // Start editing row inline
    const handleStartEdit = (row) => {
        setEditingRowId(row.id);
        setEditFormData({
            registrationNo: row.registrationNo,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phoneNumber: row.phoneNumber,
            password: row.password
        });
    };

    // Cancel edit
    const handleCancelEdit = () => {
        setEditingRowId(null);
        setEditFormData({});
    };

    // Save inline row edit
    const handleSaveEdit = (id) => {
        setStudentsData((prev) => {
            const next = prev.map((item) => {
                if (item.id === id) {
                    return {
                        ...item,
                        ...editFormData
                    };
                }
                return item;
            });

            // Re-validate all rows against updated data
            return next.map((st) => {
                const res = validateStudentDataRow(st, existingStudents, next);
                return {
                    id: st.id,
                    ...res.normalizedStudent,
                    isValid: res.isValid,
                    errors: res.errors
                };
            });
        });

        setEditingRowId(null);
        setEditFormData({});
    };

    // Compute stats
    const totalCount = studentsData.length;
    const validCount = studentsData.filter((s) => s.isValid).length;
    const invalidCount = totalCount - validCount;

    // Perform final import submission
    const handleImportSubmit = async () => {
        const validStudents = studentsData.filter((s) => s.isValid);

        if (validStudents.length === 0) {
            setSubmitError("There are no valid student records to import. Please review and fix the errors.");
            return;
        }

        try {
            setIsSubmitting(true);
            setSubmitError("");

            const payload = {
                students: validStudents.map((s) => ({
                    registrationNo: s.registrationNo,
                    firstName: s.firstName,
                    lastName: s.lastName,
                    email: s.email,
                    phoneNumber: s.phoneNumber,
                    password: s.password || DEFAULT_STUDENT_PASSWORD
                }))
            };

            const response = await apiRequest("/api/students/bulk", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            const count = response.importedCount || validStudents.length;
            onSuccess(count, response.message);
            handleClose();
        } catch (err) {
            console.error("Bulk import failed:", err);
            if (err.status === 401) {
                onAuthError();
                return;
            }
            if (err.data && err.data.errors && err.data.errors.length > 0) {
                const firstErr = err.data.errors[0];
                setSubmitError(`${err.data.message || "Import failed"}: Row ${firstErr.row} - ${firstErr.message}`);
            } else {
                setSubmitError(err.message || "Failed to import students. Please check your data and try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div
                className="modal-content student-import-modal-card"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="import-csv-title"
            >
                {/* Header */}
                <div className="form-card-header">
                    <div>
                        <h2 id="import-csv-title" className="import-modal-title">
                            Import Students from CSV
                        </h2>
                        <p className="import-modal-subtitle">
                            Upload a CSV file to automatically import all student accounts into the system.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="modal-close-button"
                        onClick={handleClose}
                        aria-label="Close import dialog"
                        disabled={isSubmitting}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="import-modal-body">
                    {/* CSV Template Bar */}
                    <div className="import-template-bar">
                        <div className="import-template-info">
                            <FileSpreadsheet size={18} className="template-icon" />
                            <span>
                                Required columns: <strong>Registration Number, First Name, Last Name, Email, Phone Number</strong> (Password is optional).
                            </span>
                        </div>
                        <button
                            type="button"
                            className="download-template-button"
                            onClick={handleDownloadTemplate}
                            title="Download sample CSV template"
                        >
                            <Download size={14} />
                            Template
                        </button>
                    </div>

                    {/* Dropzone / Upload area */}
                    {studentsData.length === 0 ? (
                        <div
                            className={`csv-dropzone ${isDragging ? "dragging" : ""}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                id={fileInputId}
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,text/csv"
                                className="csv-file-input"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        processFile(e.target.files[0]);
                                    }
                                }}
                            />
                            <div className="dropzone-content">
                                <div className="dropzone-icon-wrapper">
                                    <Upload size={32} />
                                </div>
                                <h3 className="dropzone-heading">
                                    {isParsing ? "Reading and validating CSV..." : "Drag and drop your CSV file here"}
                                </h3>
                                <p className="dropzone-sub">
                                    or{" "}
                                    <label htmlFor={fileInputId} className="dropzone-browse-label">
                                        browse from your computer
                                    </label>
                                </p>
                                <span className="dropzone-format-info">
                                    Standard CSV (.csv) up to 5MB. Password defaults to <code>Student@123</code> if omitted.
                                </span>
                            </div>
                        </div>
                    ) : (
                        /* Uploaded file pill bar */
                        <div className="uploaded-file-bar">
                            <div className="file-info-col">
                                <FileSpreadsheet size={20} className="file-badge-icon" />
                                <div>
                                    <strong className="file-name">{fileName}</strong>
                                    <span className="file-meta">
                                        {(fileSize / 1024).toFixed(1)} KB • {totalCount} student{totalCount === 1 ? "" : "s"} detected
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="change-file-button"
                                onClick={handleReset}
                                disabled={isSubmitting}
                            >
                                <RefreshCw size={14} />
                                Change File
                            </button>
                        </div>
                    )}

                    {/* Parse Error Banner */}
                    {parseError && (
                        <div className="import-alert-error" role="alert">
                            <AlertCircle size={18} className="alert-icon" />
                            <div className="alert-text">{parseError}</div>
                        </div>
                    )}

                    {/* Submit Error Banner */}
                    {submitError && (
                        <div className="import-alert-error" role="alert">
                            <AlertCircle size={18} className="alert-icon" />
                            <div className="alert-text">{submitError}</div>
                        </div>
                    )}

                    {/* Preview Table & Stats */}
                    {studentsData.length > 0 && (
                        <div className="import-preview-section">
                            {/* Summary Badges */}
                            <div className="import-stats-row">
                                <div className="import-stat-badge stat-total">
                                    <span>Total Records:</span>
                                    <strong>{totalCount}</strong>
                                </div>
                                <div className="import-stat-badge stat-valid">
                                    <CheckCircle2 size={16} />
                                    <span>Ready to Import:</span>
                                    <strong>{validCount}</strong>
                                </div>
                                {invalidCount > 0 && (
                                    <div className="import-stat-badge stat-invalid">
                                        <XCircle size={16} />
                                        <span>Needs Attention:</span>
                                        <strong>{invalidCount}</strong>
                                    </div>
                                )}
                            </div>

                            {invalidCount > 0 && (
                                <div className="import-warning-note">
                                    <span>
                                        ⚠️ {invalidCount} student record{invalidCount === 1 ? "" : "s"} have validation issues or duplicate values.
                                        You can edit records inline or remove invalid rows before submitting.
                                    </span>
                                </div>
                            )}

                            {/* Data Table */}
                            <div className="import-table-container">
                                <table className="import-preview-table">
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th>Reg. No</th>
                                            <th>First Name</th>
                                            <th>Last Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Password</th>
                                            <th className="th-actions">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentsData.map((row) => {
                                            const isEditing = editingRowId === row.id;

                                            return (
                                                <tr key={row.id} className={row.isValid ? "row-valid" : "row-invalid"}>
                                                    {/* Status Badge */}
                                                    <td className="td-status">
                                                        {row.isValid ? (
                                                            <span className="badge-valid" title="Valid record ready for import">
                                                                <CheckCircle2 size={14} />
                                                                Valid
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className="badge-invalid"
                                                                title={Object.values(row.errors).join("; ")}
                                                            >
                                                                <XCircle size={14} />
                                                                Error
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Reg No */}
                                                    <td>
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                className="inline-edit-input"
                                                                value={editFormData.registrationNo}
                                                                onChange={(e) =>
                                                                    setEditFormData((prev) => ({
                                                                        ...prev,
                                                                        registrationNo: e.target.value
                                                                    }))
                                                                }
                                                            />
                                                        ) : (
                                                            <span className="cell-text">
                                                                {row.registrationNo || <em className="text-missing">Missing</em>}
                                                            </span>
                                                        )}
                                                        {row.errors.registrationNo && (
                                                            <span className="cell-error-msg">{row.errors.registrationNo}</span>
                                                        )}
                                                    </td>

                                                    {/* First Name */}
                                                    <td>
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                className="inline-edit-input"
                                                                value={editFormData.firstName}
                                                                onChange={(e) =>
                                                                    setEditFormData((prev) => ({
                                                                        ...prev,
                                                                        firstName: e.target.value
                                                                    }))
                                                                }
                                                            />
                                                        ) : (
                                                            <span className="cell-text">
                                                                {row.firstName || <em className="text-missing">Missing</em>}
                                                            </span>
                                                        )}
                                                        {row.errors.firstName && (
                                                            <span className="cell-error-msg">{row.errors.firstName}</span>
                                                        )}
                                                    </td>

                                                    {/* Last Name */}
                                                    <td>
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                className="inline-edit-input"
                                                                value={editFormData.lastName}
                                                                onChange={(e) =>
                                                                    setEditFormData((prev) => ({
                                                                        ...prev,
                                                                        lastName: e.target.value
                                                                    }))
                                                                }
                                                            />
                                                        ) : (
                                                            <span className="cell-text">
                                                                {row.lastName || <em className="text-missing">Missing</em>}
                                                            </span>
                                                        )}
                                                        {row.errors.lastName && (
                                                            <span className="cell-error-msg">{row.errors.lastName}</span>
                                                        )}
                                                    </td>

                                                    {/* Email */}
                                                    <td>
                                                        {isEditing ? (
                                                            <input
                                                                type="email"
                                                                className="inline-edit-input"
                                                                value={editFormData.email}
                                                                onChange={(e) =>
                                                                    setEditFormData((prev) => ({
                                                                        ...prev,
                                                                        email: e.target.value
                                                                    }))
                                                                }
                                                            />
                                                        ) : (
                                                            <span className="cell-text">
                                                                {row.email || <em className="text-missing">Missing</em>}
                                                            </span>
                                                        )}
                                                        {row.errors.email && (
                                                            <span className="cell-error-msg">{row.errors.email}</span>
                                                        )}
                                                    </td>

                                                    {/* Phone */}
                                                    <td>
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                className="inline-edit-input"
                                                                value={editFormData.phoneNumber}
                                                                onChange={(e) =>
                                                                    setEditFormData((prev) => ({
                                                                        ...prev,
                                                                        phoneNumber: e.target.value
                                                                    }))
                                                                }
                                                            />
                                                        ) : (
                                                            <span className="cell-text">
                                                                {row.phoneNumber || <em className="text-missing">Missing</em>}
                                                            </span>
                                                        )}
                                                        {row.errors.phoneNumber && (
                                                            <span className="cell-error-msg">{row.errors.phoneNumber}</span>
                                                        )}
                                                    </td>

                                                    {/* Password */}
                                                    <td>
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                className="inline-edit-input"
                                                                value={editFormData.password}
                                                                placeholder="Student@123"
                                                                onChange={(e) =>
                                                                    setEditFormData((prev) => ({
                                                                        ...prev,
                                                                        password: e.target.value
                                                                    }))
                                                                }
                                                            />
                                                        ) : (
                                                            <span className="cell-pwd-text">
                                                                {row.password ? "••••••••" : DEFAULT_STUDENT_PASSWORD}
                                                            </span>
                                                        )}
                                                        {row.errors.password && (
                                                            <span className="cell-error-msg">{row.errors.password}</span>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="td-actions">
                                                        {isEditing ? (
                                                            <div className="row-action-btns">
                                                                <button
                                                                    type="button"
                                                                    className="btn-save-inline"
                                                                    onClick={() => handleSaveEdit(row.id)}
                                                                    title="Save changes"
                                                                >
                                                                    <Check size={15} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn-cancel-inline"
                                                                    onClick={handleCancelEdit}
                                                                    title="Cancel edit"
                                                                >
                                                                    <X size={15} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="row-action-btns">
                                                                <button
                                                                    type="button"
                                                                    className="btn-edit-inline"
                                                                    onClick={() => handleStartEdit(row)}
                                                                    title="Edit record"
                                                                >
                                                                    <Edit3 size={15} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn-delete-inline"
                                                                    onClick={() => handleDeleteRow(row.id)}
                                                                    title="Remove from import"
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="import-modal-footer">
                    <button
                        type="button"
                        className="modal-cancel-button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>

                    {studentsData.length > 0 && (
                        <button
                            type="button"
                            className="modal-import-submit-button"
                            onClick={handleImportSubmit}
                            disabled={isSubmitting || validCount === 0}
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw size={16} className="spinning" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    Import {validCount} Student{validCount === 1 ? "" : "s"}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
