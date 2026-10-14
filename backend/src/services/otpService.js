
const crypto = require("crypto");

// ==========================================
// GENERATE SIX-DIGIT OTP
// ==========================================

const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};


// ==========================================
// HASH OTP
// ==========================================

const hashOTP = (otp) => {
    const secret = process.env.OTP_SECRET;

    if (!secret) {
        throw new Error("OTP_SECRET is not configured");
    }

    return crypto
        .createHmac("sha256", secret)
        .update(String(otp))
        .digest("hex");
};


// ==========================================
// SAFELY COMPARE OTP HASHES
// ==========================================

const safeHashCompare = (storedHash, submittedOtp) => {
    if (
        typeof storedHash !== "string" ||
        !/^[a-f0-9]{64}$/i.test(storedHash)
    ) {
        return false;
    }

    const submittedHash = hashOTP(submittedOtp);

    const storedBuffer = Buffer.from(storedHash, "hex");
    const submittedBuffer = Buffer.from(submittedHash, "hex");

    if (storedBuffer.length !== submittedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        storedBuffer,
        submittedBuffer
    );
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    generateOTP,
    hashOTP,
    safeHashCompare
};
