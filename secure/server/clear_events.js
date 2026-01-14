import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" }); // Assuming running from server dir

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db(); // Uses DB from connection string

        console.log("Connected to DB, clearing events...");

        const result = await db.collection("events").deleteMany({});
        console.log(`Deleted ${result.deletedCount} events.`);

        const regResult = await db.collection("registrations").deleteMany({});
        console.log(`Deleted ${regResult.deletedCount} registrations.`);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

run();
