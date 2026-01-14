import express from "express";
import { ObjectId } from "mongodb";
import {
  createParticipant,
  getParticipants,
  getParticipantById,
  updateParticipant,
  deleteParticipant
} from "../repositories/participantsRepo.js";

const router = express.Router();

// 建立參與者
router.post("/", async (req, res) => {
  const participant = await createParticipant(req.body);
  res.json(participant);
});

// 取得所有參與者
router.get("/", async (req, res) => {
  const list = await getParticipants();
  res.json(list);
});

// 取得單一參與者
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      ok: false,
      error: "Invalid participant id"
    });
  }

  const participant = await getParticipantById(id);
  res.json(participant);
});

// 更新參與者
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      ok: false,
      error: "Invalid participant id"
    });
  }

  await updateParticipant(id, req.body);
  res.json({ ok: true });
});

// 刪除參與者
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      ok: false,
      error: "Invalid participant id"
    });
  }

  await deleteParticipant(id);
  res.json({ ok: true });
});

export default router;
