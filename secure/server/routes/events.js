import express from "express";
import { listByEvent } from "../repositories/registrationsRepo.js";
import { ObjectId } from "mongodb";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
} from "../repositories/eventsRepo.js";
import { requireAuth, isAdmin } from "../middleware/authMiddleware.js";
import { validate, eventSchema } from "../middleware/validation.js";

const router = express.Router();

// 新增活動 (Admin Only)
router.post("/", requireAuth, isAdmin, validate(eventSchema), async (req, res) => {
  const event = await createEvent(req.body);
  res.json(event);
});

// 取得所有活動 (Public)
router.get("/", async (req, res) => {
  const events = await getEvents();
  res.json(events);
});

// 取得單一活動 (Public)
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      ok: false,
      error: "Invalid event id"
    });
  }

  const event = await getEventById(id);
  res.json(event);
});

// 更新活動 (Admin Only)
router.put("/:id", requireAuth, isAdmin, validate(eventSchema), async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      ok: false,
      error: "Invalid event id"
    });
  }

  await updateEvent(id, req.body);
  res.json({ ok: true });
});

// 刪除活動 (Admin Only)
router.delete("/:id", requireAuth, isAdmin, async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      ok: false,
      error: "Invalid event id"
    });
  }

  await deleteEvent(id);
  res.json({ ok: true });
});

// 某活動的報名名單 (Admin Only, 一般使用者應只能看自己的)
router.get("/:eventId/registrations", requireAuth, isAdmin, async (req, res) => {
  const { eventId } = req.params;

  if (!ObjectId.isValid(eventId)) {
    return res.status(400).json({ ok: false, error: "Invalid event id" });
  }

  const list = await listByEvent(eventId);
  res.json(list);
});

export default router; // 
