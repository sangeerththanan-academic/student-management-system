const getLastLoginLabel = (value) => {
    if (!value) {
        return "Never";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Never";
    }

    const day = String(date.getUTCDate()).padStart(2, "0");
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = monthNames[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

const shouldTrackStudentLogin = (user) => {
    return Boolean(user && user.role === "STUDENT");
};

module.exports = {
    getLastLoginLabel,
    shouldTrackStudentLogin
};
