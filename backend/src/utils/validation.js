/**
 * Validation utilities for Student Input Data (CR-004)
 */

const validateRegistrationNo = (registrationNo) => {
    if (!registrationNo || typeof registrationNo !== "string" || !registrationNo.trim()) {
        return "Registration number is required";
    }
    const trimmed = registrationNo.trim();
    if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
        return "Registration number must contain only letters, numbers, hyphens, or underscores";
    }
    return null;
};

const validateName = (name, fieldLabel) => {
    if (!name || typeof name !== "string" || !name.trim()) {
        return `${fieldLabel} is required`;
    }
    const trimmed = name.trim();
    if (trimmed.length < 3) {
        return `${fieldLabel} must contain at least 3 characters`;
    }
    if (!/^[A-Za-z\s]+$/.test(trimmed)) {
        return `${fieldLabel} must contain valid alphabetic characters only`;
    }
    return null;
};

const validateEmail = (email) => {
    if (!email || typeof email !== "string" || !email.trim()) {
        return "Email address is required";
    }
    const trimmed = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
        return "Email must follow a valid email format";
    }
    return null;
};

const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber || typeof phoneNumber !== "string" || !phoneNumber.trim()) {
        return "Phone number is required";
    }
    const trimmed = phoneNumber.trim();
    if (!/^\d+$/.test(trimmed)) {
        return "Phone number must contain numeric characters only";
    }
    if (trimmed.length !== 10) {
        return "Phone number must contain exactly 10 digits";
    }
    return null;
};

const validatePassword = (password) => {
    if (!password || typeof password !== "string") {
        return "Password is required when creating a new student";
    }
    if (password.length < 8) {
        return "Password must contain at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
        return "Password must contain at least one special character";
    }
    return null;
};

const validateStudentData = (data, isEdit = false) => {
    const {
        registrationNo,
        firstName,
        lastName,
        email,
        phoneNumber,
        password
    } = data || {};

    const errors = {};

    const regError = validateRegistrationNo(registrationNo);
    if (regError) errors.registrationNo = regError;

    const firstNameError = validateName(firstName, "First name");
    if (firstNameError) errors.firstName = firstNameError;

    const lastNameError = validateName(lastName, "Last name");
    if (lastNameError) errors.lastName = lastNameError;

    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;

    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) errors.phoneNumber = phoneError;

    if (!isEdit) {
        const passwordError = validatePassword(password);
        if (passwordError) errors.password = passwordError;
    } else if (password !== undefined && password !== null && password !== "") {
        const passwordError = validatePassword(password);
        if (passwordError) errors.password = passwordError;
    }

    const errorKeys = Object.keys(errors);
    return {
        isValid: errorKeys.length === 0,
        errors,
        firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : null
    };
};

module.exports = {
    validateRegistrationNo,
    validateName,
    validateEmail,
    validatePhoneNumber,
    validatePassword,
    validateStudentData
};
