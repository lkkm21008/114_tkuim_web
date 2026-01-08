import { ObjectId } from "mongodb";
import { getDB } from "../db.js";

const COL = "registrations";

export async function register({ eventId, participantId }) {
  const db = getDB();

  const eId = new ObjectId(eventId);
  const pId = new ObjectId(participantId);

  // 防重複報名：同一活動 + 同一參與者只能一筆
  const existed = await db.collection(COL).findOne({ eventId: eId, participantId: pId });
  if (existed) return { ok: false, error: "Already registered", registration: existed };

  const doc = {
    eventId: eId,
    participantId: pId,
    checkedIn: false,
    registeredAt: new Date(),
    checkedInAt: null
  };

  const result = await db.collection(COL).insertOne(doc);
  return { ok: true, registration: { ...doc, _id: result.insertedId } };
}

export async function listByEvent(eventId) {
  const db = getDB();
  const eId = new ObjectId(eventId);

  // 聚合：把 participant 資料 join 回來，前端/助教看起來超清楚
  return db.collection(COL).aggregate([
    { $match: { eventId: eId } },
    {
      $lookup: {
        from: "participants",
        localField: "participantId",
        foreignField: "_id",
        as: "participant"
      }
    },
    { $unwind: { path: "$participant", preserveNullAndEmptyArrays: true } },
    { $sort: { registeredAt: -1 } },
    {
      $project: {
        eventId: 1,
        participantId: 1,
        checkedIn: 1,
        registeredAt: 1,
        checkedInAt: 1,
        participant: { name: 1, email: 1, phone: 1 }
      }
    }
  ]).toArray();
}

export async function checkin(registrationId) {
  const db = getDB();
  const rId = new ObjectId(registrationId);

  const result = await db.collection(COL).updateOne(
    { _id: rId },
    { $set: { checkedIn: true, checkedInAt: new Date() } }
  );

  return result.modifiedCount === 1;
}

export async function cancel(registrationId) {
  const db = getDB();
  const rId = new ObjectId(registrationId);

  const result = await db.collection(COL).deleteOne({ _id: rId });
  return result.deletedCount === 1;
}

export async function getRegistrationById(id) {
  const db = getDB();
  return db.collection(COL).findOne({ _id: new ObjectId(id) });
}

export async function countByParticipantId(participantId) {
  const db = getDB();
  return db.collection(COL).countDocuments({ participantId: new ObjectId(participantId) });
}
