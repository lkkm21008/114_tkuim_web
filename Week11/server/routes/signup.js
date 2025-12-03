import express from "express";
import {
  createParticipant,
  listParticipants,
  updateParticipant,
  deleteParticipant
} from "../repositories/participants.js";

export const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone)
      return res.status(400).json({ error: "缺少欄位" });

    const id = await createParticipant({ name, email, phone });
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

    const result = await listParticipants(page, limit);
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
    const result = await deleteParticipant(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
