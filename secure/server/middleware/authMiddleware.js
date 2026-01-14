import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_unsafe_secret_CHANGE_ME";

// 驗證 JWT Token
export const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ ok: false, error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { userId, email, role, ... }
        next();
    } catch (err) {
        return res.status(401).json({ ok: false, error: "Unauthorized: Invalid token" });
    }
};

// 驗證是否為 Admin
// 必須放在 requireAuth 之後使用
export const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ ok: false, error: "Forbidden: Admins only" });
    }
    next();
};
