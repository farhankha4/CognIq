import express from "express";
import path from "path";
import cors from "cors";
import { serve } from "inngest/express";
import { inngest ,functions } from "./lib/inngest.js";
import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { clerkMiddleware } from "@clerk/express";
import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";


const app = express();

const __dirname = path.resolve();

const allowedOrigins = [
  ENV.CLIENT_URL,
  "https://your-cogniq.vercel.app",
  "http://localhost:5173",
  "http://localhost:5000",
]
  .filter(Boolean)
  .map((url) => url.replace(/\/$/, ""));

app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, "");
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);
app.use(clerkMiddleware()); // this adds auth field to request object: req.auth()

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.use("/api/inngest", serve({ client: inngest, functions }));

app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CogniQ Backend is running 🚀",
  });
});

// make our app ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Keep this for local dev
if (!process.env.VERCEL && ENV.NODE_ENV !== "production") {
  app.listen(ENV.PORT || 5000, () => console.log("Server running on port:", ENV.PORT || 5000));
}

export default app; // ✅ Vercel needs this
//succesfully deployed and running completely fine