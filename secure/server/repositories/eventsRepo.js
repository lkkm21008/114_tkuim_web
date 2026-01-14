import { ObjectId } from "mongodb";
import { getDB } from "../db.js";

const COLLECTION = "events";

// 新增活動
export async function createEvent(data) {
  const db = getDB();
  const doc = {
    title: data.title,
    date: new Date(data.date),
    location: data.location,
    quota: Number(data.quota),
    description: data.description || "",
    createdAt: new Date()
  };

  const result = await db.collection(COLLECTION).insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

// 取得所有活動
export async function getEvents() {
  const db = getDB();
  return db.collection(COLLECTION).find().sort({ date: 1 }).toArray();
}

// 取得單一活動
export async function getEventById(id) {
  const db = getDB();
  return db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
}

// 更新活動
export async function updateEvent(id, data) {
  const db = getDB();
  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        title: data.title,
        date: data.date ? new Date(data.date) : undefined,
        location: data.location,
        quota: data.quota ? Number(data.quota) : undefined,
        description: data.description
      }
    }
  );
}

// 刪除活動
export async function deleteEvent(id) {
  const db = getDB();
  await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
}
