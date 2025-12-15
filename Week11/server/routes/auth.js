import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  createUser,
  findUserByEmail,
} from "../repositories/users.js";

export const router = express.Router();

// signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const id = await createUser({ email, password, role });
    res.status(201).json({ id });
  } catch (err) {
    if (err.message === "UserExists") {
      return res.status(400).json({ error: "帳號已存在" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ error: "帳號或密碼錯誤" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "帳號或密碼錯誤" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});
