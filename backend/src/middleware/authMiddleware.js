const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token"
        });
    }
};


const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: "Access denied: User role not found"
            });
        }

        const userRole = String(req.user.role).toUpperCase();

        const normalizedAllowedRoles = allowedRoles.map(
            (role) => String(role).toUpperCase()
        );

        if (!normalizedAllowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "Access denied: Insufficient permissions"
            });
        }

        next();
    };
};


module.exports = {
    authenticate,
    authorizeRoles
};
