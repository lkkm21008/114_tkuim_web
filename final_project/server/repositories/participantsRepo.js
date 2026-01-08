import { ObjectId } from "mongodb";
import { getDB } from "../db.js";

const COLLECTION = "participants";

export async function createParticipant(data) {
  const db = getDB();
  const email = (data.email || "").toLowerCase();

  // 檢查是否已存在 (Email 當作唯一識別)
  const existing = await db.collection(COLLECTION).findOne({ email });
  if (existing) {
    // 若已存在，直接回傳舊的 (讓後續報名邏輯判斷 eventId+participantId 是否重複)
    return existing;
  }

  const doc = {
    name: data.name,
    email: email,
    phone: data.phone || "",
    createdAt: new Date()
  };

  const result = await db.collection(COLLECTION).insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getParticipants() {
  const db = getDB();
  return db.collection(COLLECTION).find().sort({ createdAt: -1 }).toArray();
}

export async function getParticipantById(id) {
  const db = getDB();
  return db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
}

export async function updateParticipant(id, data) {
  const db = getDB();

  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name: data.name,
        email: data.email ? data.email.toLowerCase() : undefined,
        phone: data.phone
      }
    }
  );
}

export async function deleteParticipant(id) {
  const db = getDB();
  await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
}
