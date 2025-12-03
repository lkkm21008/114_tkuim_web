import { ObjectId } from "mongodb";
import { getDB } from "../db.js";

const col = () => getDB().collection("participants");

export async function createParticipant(data) {
  const existing = await col().findOne({ email: data.email });
  if (existing) throw new Error("EmailExists");

  const result = await col().insertOne({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId;
}

export async function listParticipants(page, limit) {
  const skip = (page - 1) * limit;

  const items = await col()
    .find()
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await col().countDocuments();
  return { items, total };
}

export async function updateParticipant(id, data) {
  return await col().updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...data, updatedAt: new Date() } }
  );
}

export async function deleteParticipant(id) {
  return await col().deleteOne({ _id: new ObjectId(id) });
}
