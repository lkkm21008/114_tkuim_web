import express from "express";
import { ObjectId } from "mongodb";
import { register, checkin, cancel, getRegistrationById, countByParticipantId } from "../repositories/registrationsRepo.js";
import { deleteParticipant } from "../repositories/participantsRepo.js";

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

  // 1. 取得 registration 以便知道是哪個 participant
  const reg = await getRegistrationById(id);
  if (!reg) {
    return res.status(404).json({ ok: false, error: "Registration not found" });
  }
  const pid = reg.participantId;

  // 2. 刪除報名
  const ok = await cancel(id);

  // 3. 檢查是否還有其他報名，若無則刪除參與者
  if (ok && pid) {
    const count = await countByParticipantId(pid);
    if (count === 0) {
      await deleteParticipant(pid);
      // console.log(`Orphan participant ${pid} deleted.`);
    }
  }

  res.json({ ok });
});

export default router;
