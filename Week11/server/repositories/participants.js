import { ObjectId } from "mongodb";
import { getDB } from "../db.js";

const col = () => getDB().collection("participants");

/**
 * 建立報名資料
 * - 檢查 email 唯一
 * - 儲存 ownerId（建立者）
 */
export async function createParticipant(data) {
  const existing = await col().findOne({ email: data.email });
  if (existing) {
    throw new Error("EmailExists");
  }

  const result = await col().insertOne({
    ...data,              // name, email, phone, ownerId
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return result.insertedId;
}

/**
 * 取得報名清單（含分頁）
 * - admin：filter = {}
 * - student：filter = { ownerId }
 */
export async function listParticipants(page, limit, filter = {}) {
  const skip = (page - 1) * limit;

  const items = await col()
    .find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .toArray();

  const total = await col().countDocuments(filter);

  return { items, total };
}

/**
 * 更新報名資料
 * （課程通常允許登入者更新，不特別限制）
 */
export async function updateParticipant(id, data) {
  const result = await col().updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...data,
        updatedAt: new Date(),
      },
    }
  );

  return result;
}

/**
 * 刪除報名資料
 * - admin：可刪任何資料
 * - student：只能刪自己的（ownerId）
 */
export async function deleteParticipant(id, user) {
  const filter =
    user.role === "admin"
      ? { _id: new ObjectId(id) }
      : { _id: new ObjectId(id), ownerId: user.id };

  const result = await col().deleteOne(filter);

  return result.deletedCount === 1;
}
