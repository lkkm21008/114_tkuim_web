import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createParticipant,
  listParticipants,
  updateParticipant,
  deleteParticipant
} from "../repositories/participants.js";

export const router = express.Router();


router.use(requireAuth);

router.post("/", async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: "缺少必要欄位" });
    }

    const id = await createParticipant({
      name,
      email,
      phone,
      ownerId: req.user.id, //  記錄建立者
    });

    res.status(201).json({ id });
  } catch (err) {
    if (err.message === "EmailExists") {
      return res.status(400).json({ error: "此 email 已報名過" });
    }
    next(err);
  }
});


router.get("/", async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const filter =
      req.user.role === "admin"
        ? {}
        : { ownerId: req.user.id };

    const result = await listParticipants(page, limit, filter);
    res.json(result);
  } catch (err) {
    next(err);
  }
});


router.patch("/:id", async (req, res, next) => {
  try {
    const result = await updateParticipant(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});


router.delete("/:id", async (req, res, next) => {
  try {
    const ok = await deleteParticipant(req.params.id, req.user);

    if (!ok) {
      return res.status(403).json({ error: "無權限刪除" });
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
