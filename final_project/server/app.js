import express from "express";
import cors from "cors";
import "dotenv/config";
import registrationsRoutes from "./routes/registrations.js";

import { connectDB } from "./db.js";
import eventsRoutes from "./routes/events.js";
import participantsRoutes from "./routes/participants.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/api/events", eventsRoutes);
app.use("/api/participants", participantsRoutes);
app.use("/api/registrations", registrationsRoutes);

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("Server running on port", process.env.PORT);
    });
  })
  .catch(console.error);
