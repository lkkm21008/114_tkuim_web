import { ObjectId } from "mongodb";
import { getDB } from "../db.js";
import bcrypt from "bcrypt";

const COLLECTION = "participants";

export async function createParticipant(data) {
  const db = getDB();
  const email = (data.email || "").toLowerCase();

  // 檢查是否已存在 (Email 當作唯一識別)
  const existing = await db.collection(COLLECTION).findOne({ email });
  if (existing) {
    // 若已存在，直接回傳舊的 (讓後續報名邏輯判斷 eventId+participantId 是否重複)
    // 注意：這裡可能需要考量安全性，若使用者嘗試註冊已存在的 email，是否該報錯？
    // 但為保持原有邏輯相容性，暫維持回傳舊資料，但在註冊流程中可能會被 Validation 擋下
    return existing;
  }

  // 密碼處理
  let passwordHash = null;
  if (data.password) {
    passwordHash = await bcrypt.hash(data.password, 10);
  }

  const doc = {
    name: data.name,
    email: email,
    phone: data.phone || "",
    role: data.role || "user", // 預設為一般使用者
    password: passwordHash,     // 儲存雜湊密碼
    createdAt: new Date()
  };

  const result = await db.collection(COLLECTION).insertOne(doc);
  const { password, ...userWithoutPassword } = doc; // 回傳時移除密碼
  return { ...userWithoutPassword, _id: result.insertedId };
}

export async function getParticipants() {
  const db = getDB();
  // 不回傳密碼
  return db.collection(COLLECTION).find().project({ password: 0 }).sort({ createdAt: -1 }).toArray();
}

export async function getParticipantById(id) {
  const db = getDB();
  // 不回傳密碼
  return db.collection(COLLECTION).findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });
}

// 專供登入驗證使用 (需取得密碼)
export async function getParticipantByEmailWithPassword(email) {
  const db = getDB();
  return db.collection(COLLECTION).findOne({ email: email.toLowerCase() });
}

export async function updateParticipant(id, data) {
  const db = getDB();
  
  const updateDoc = {
    name: data.name,
    email: data.email ? data.email.toLowerCase() : undefined,
    phone: data.phone
  };

  // 如果有更新權限 (僅 Admin 操作時會用到，需小心使用)
  if (data.role) {
    updateDoc.role = data.role;
  }
  
  // 如果有更新密碼 (重設密碼功能)
  if (data.password) {
    updateDoc.password = await bcrypt.hash(data.password, 10);
  }

  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(id) },
    { $set: updateDoc }
  );
}

export async function deleteParticipant(id) {
  const db = getDB();
  await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
}
