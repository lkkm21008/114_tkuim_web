import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "未登入" });
  }

  const token = auth.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; 
    // payload = { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token 無效或過期" });
  }
}
