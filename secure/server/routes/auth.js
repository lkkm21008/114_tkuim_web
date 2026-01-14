import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import { createParticipant, getParticipantByEmailWithPassword } from "../repositories/participantsRepo.js";
import { registerSchema, loginSchema, validate } from "../middleware/validation.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "default_unsafe_secret_CHANGE_ME";

// Login Rate Limiter: 1 分鐘最多 5 次
const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: { ok: false, error: "Too many login attempts, please try again later." },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// 註冊
router.post("/register", validate(registerSchema), async (req, res) => {
    try {
        const participant = await createParticipant(req.body);
        // 註冊成功後是否直接回傳 token? 這裡看需求，暫時不回傳，讓使用者去登入
        res.status(201).json(participant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: "Internal Server Error" });
    }
});

// 登入
router.post("/login", loginLimiter, validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await getParticipantByEmailWithPassword(email);
        if (!user) {
            return res.status(401).json({ ok: false, error: "Invalid email or password" });
        }

        // 若使用者是舊資料沒有密碼，可能需要特殊處理 (例如提示重設密碼)
        // 這裡假設都走新流程
        if (!user.password) {
            return res.status(401).json({ ok: false, error: "User has no password set. Please contact admin." });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ ok: false, error: "Invalid email or password" });
        }

        // 簽發 Token
        const payload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role || "user"
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" }); // 1天過期

        res.json({
            ok: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || "user"
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: "Internal Server Error" });
    }
});

export default router;
