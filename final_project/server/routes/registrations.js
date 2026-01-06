import express from "express";
import { ObjectId } from "mongodb";
import { register, checkin, cancel } from "../repositories/registrationsRepo.js";

const router = express.Router();

// 報名
router.post("/", async (req, res) => {
  const { eventId, participantId } = req.body || {};

  if (!ObjectId.isValid(eventId) || !ObjectId.isValid(participantId)) {
    return res.status(400).json({ ok: false, error: "Invalid eventId or participantId" });
  }

  const result = await register({ eventId, participantId });

  if (!result.ok) {
    return res.status(409).json(result); // 409 = duplicate
  }
  res.json(result);
});

// 簽到
router.patch("/:id/checkin", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ ok: false, error: "Invalid registration id" });
  }

  const ok = await checkin(id);
  res.json({ ok });
});

// 取消報名
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ ok: false, error: "Invalid registration id" });
  }

  const ok = await cancel(id);
  res.json({ ok });
});

export default router;
