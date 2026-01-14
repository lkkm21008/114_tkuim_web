import express from "express";
import { ObjectId } from "mongodb";
import {
  register,
  checkin,
  cancel,
  getRegistrationById,
  countByParticipantId,
  listByParticipant,
  listAll
} from "../repositories/registrationsRepo.js";
import { deleteParticipant } from "../repositories/participantsRepo.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// 全部路由都需要登入
router.use(requireAuth);

// 報名
router.post("/", async (req, res) => {
  const { eventId } = req.body || {};
  let { participantId } = req.body || {};

  // 若不是 Admin，只能幫自己報名
  if (req.user.role !== "admin") {
    participantId = req.user.userId;
  }

  if (!ObjectId.isValid(eventId) || !ObjectId.isValid(participantId)) {
    return res.status(400).json({ ok: false, error: "Invalid eventId or participantId" });
  }

  const result = await register({ eventId, participantId });

  if (!result.ok) {
    return res.status(409).json(result); // 409 = duplicate
  }
  res.json(result);
});

// 查詢報名 (Admin: 全部, User: 自己的)
router.get("/", async (req, res) => {
  if (req.user.role === "admin") {
    const list = await listAll();
    res.json(list);
  } else {
    // User
    const list = await listByParticipant(req.user.userId);
    res.json(list);
  }
});

// 簽到
router.patch("/:id/checkin", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ ok: false, error: "Invalid registration id" });
  }

  // 權限檢查
  if (req.user.role !== "admin") {
    const reg = await getRegistrationById(id);
    if (!reg) return res.status(404).json({ ok: false, error: "Registration not found" });

    // 只能簽到自己的
    if (reg.participantId.toString() !== req.user.userId) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
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

  // 1. 取得 registration
  const reg = await getRegistrationById(id);
  if (!reg) {
    return res.status(404).json({ ok: false, error: "Registration not found" });
  }
  const pid = reg.participantId;

  // 2. 權限檢查
  if (req.user.role !== "admin") {
    // 只能取消自己的
    if (pid.toString() !== req.user.userId) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
  }

  // 3. 刪除報名
  const ok = await cancel(id);

  // 4. 檢查是否還有其他報名，若無且該使用者是"沒有密碼的舊參與者"(或依特定邏輯)，才刪除？
  // 修正：現在改為 User 系統，其實不應該隨便刪除 Participant (User)
  // 但依照之前的清潔邏輯 (Orphan Cleanup)，如果該 Participant 真的"沒有任何報名"，且可能是"臨時生成的"？
  // 為了安全起見，如果升級為 User 系統，【不應該】刪除 User，除非 User 之後自己刪帳號。
  // 但為了符合之前的需求 "Orphan Cleanup"，我們判斷：如果是 Admin 刪除，或 User 自己取消...
  // 用戶若有密碼 (已註冊 Users)，刪除所有報名後，帳號應該還在才對。
  // 所以這裡可能要拿掉 "刪除 Participant" 邏輯，或者僅針對 "沒有密碼/Role=user(?)" 的做清理。
  // 這裡為避免誤刪重要管理者或已註冊用戶，先暫時【停用】自動刪除 User 邏輯，
  // 或者僅在該 User 確實是由該次報名產生且無其它資料時才刪除。
  // 鑑於題目變更為 User 系統，建議移除「自動刪除 User」的功能，以免使用者登入後報名取消就被刪帳號。
  /*
  if (ok && pid) {
    const count = await countByParticipantId(pid);
    if (count === 0) {
       // Check if user is "temporary" or "registered"
       // 暫不刪除
       // await deleteParticipant(pid);
    }
  }
  */
  // 為了符合 "Orphan Cleanup" 的舊有邏輯，如果使用者堅持要這個功能，需要判斷該 User 是否為"完整註冊帳號"。
  // 但目前 User 結構已變，建議此步驟先保留但不執行刪除，或僅 Delete registration。

  res.json({ ok });
});

export default router;
