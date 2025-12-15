import { getDB } from "../db.js";
import bcrypt from "bcrypt";

const col = () => getDB().collection("users");

export async function createUser({ email, password, role }) {
  const exists = await col().findOne({ email });
  if (exists) throw new Error("UserExists");

  const hash = await bcrypt.hash(password, 10);

  const result = await col().insertOne({
    email,
    password: hash,
    role, // "student" | "admin"
    createdAt: new Date(),
  });

  return result.insertedId;
}

export async function findUserByEmail(email) {
  return await col().findOne({ email });
}
