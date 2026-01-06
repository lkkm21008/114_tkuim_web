import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
} from "../repositories/eventsRepo.js";

const router = express.Router();

// 新增活動
router.post("/", async (req, res) => {
  const event = await createEvent(req.body);
  res.json(event);
});

// 取得所有活動
router.get("/", async (req, res) => {
  const events = await getEvents();
  res.json(events);
});

// 取得單一活動
router.get("/:id", async (req, res) => {
  const event = await getEventById(req.params.id);
  res.json(event);
});

// 更新活動
router.put("/:id", async (req, res) => {
  await updateEvent(req.params.id, req.body);
  res.json({ ok: true });
});

// 刪除活動
router.delete("/:id", async (req, res) => {
  await deleteEvent(req.params.id);
  res.json({ ok: true });
});

export default router; // 
