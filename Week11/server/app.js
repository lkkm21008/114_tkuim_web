import express from "express";
import cors from "cors";
import "dotenv/config";

import { connectDB } from "./db.js";
import { router as signupRouter } from "./routes/signup.js";
import { router as authRouter } from "./routes/auth.js";

const app = express();

app.use(cors());
app.use(express.json());


app.use("/auth", authRouter);

app.use("/api/signup", signupRouter);

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("Server running on port", process.env.PORT);
    });
  })
  .catch(console.error);
