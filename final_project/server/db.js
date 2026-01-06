import { MongoClient } from 'mongodb';
import 'dotenv/config';

const client = new MongoClient(process.env.MONGODB_URI);

let db;

export async function connectDB() {
  if (db) return db;
  await client.connect();
  db = client.db(); // URI 已指定資料庫
  console.log('[DB] Connected to MongoDB');
  return db;
}

export function getDB() {
  if (!db) throw new Error('Database not initialized');
  return db;
}
