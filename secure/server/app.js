import express from "express";
import cors from "cors";
import "dotenv/config";

import path from "path";
import { fileURLToPath } from "url";

import eventsRoutes from "./routes/events.js";
import participantsRoutes from "./routes/participants.js";
import registrationsRoutes from "./routes/registrations.js";
import authRoutes from "./routes/auth.js"; // Import Auth Routes
import { connectDB } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// ✅ 提供前端靜態檔案（server/public）
app.use(express.static(path.join(__dirname, "public")));

// ✅ 首頁回傳 index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ API
app.use("/api/auth", authRoutes); // Auth Routes
app.use("/api/events", eventsRoutes);
app.use("/api/participants", participantsRoutes);
app.use("/api/registrations", registrationsRoutes);

connectDB()
  .then(() => {
    const port = process.env.PORT || 3001;
    app.listen(port, () => console.log("Server running on port", port));
  })
  .catch(console.error);
