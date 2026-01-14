import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import 'dotenv/config';

async function setup() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();

    console.log("Cleaning up...");
    await db.collection("participants").deleteMany({ email: { $in: ["admin@test.com", "user@test.com"] } });
    await db.collection("events").deleteMany({ title: "Test Event Security" });

    const adminPass = await bcrypt.hash("admin123", 10);
    const userPass = await bcrypt.hash("user123", 10);

    console.log("Creating users...");
    await db.collection("participants").insertMany([
        {
            name: "Admin User",
            email: "admin@test.com",
            password: adminPass,
            role: "admin",
            createdAt: new Date()
        },
        {
            name: "Normal User",
            email: "user@test.com",
            password: userPass,
            role: "user",
            createdAt: new Date()
        }
    ]);

    console.log("Setup complete. Admin: admin@test.com / admin123, User: user@test.com / user123");
    await client.close();
}

setup().catch(console.error);
