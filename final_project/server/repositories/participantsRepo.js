import { ObjectId } from "mongodb";
import { getDB } from "../db.js";

const COLLECTION = "participants";

export async function createParticipant(data) {
  const db = getDB();

  const doc = {
    name: data.name,
    email: (data.email || "").toLowerCase(),
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
