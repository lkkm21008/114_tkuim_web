import express from "express";
import cors from "cors";
import "dotenv/config";

import { connectDB } from "./db.js";
import eventsRoutes from "./routes/events.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/events", eventsRoutes);

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("Server running on port", process.env.PORT);
    });
  })
  .catch(console.error);
