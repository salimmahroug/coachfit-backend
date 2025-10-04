import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

// 🔍 DEBUG: Vérification du chargement des variables d'environnement
console.log("🔐 Variables d'environnement chargées:");
console.log("   PORT:", process.env.PORT ? "✅" : "❌");
console.log("   MONGODB_URI:", process.env.MONGODB_URI ? "✅" : "❌");
console.log("   JWT_SECRET:", process.env.JWT_SECRET ? "✅" : "❌");
console.log(
  "   AI_API_KEY:",
  process.env.AI_API_KEY
    ? "✅ Présente (longueur: " + process.env.AI_API_KEY.length + ")"
    : "❌ ABSENTE"
);
console.log("   AI_API_URL:", process.env.AI_API_URL || "Non défini");
console.log("   AI_MODEL:", process.env.AI_MODEL || "Non défini");

import authRoutes from "./routes/auth.js";
import clientRoutes from "./routes/clients.js";
import programRoutes from "./routes/programs.js";
import sessionRoutes from "./routes/sessions.js";
import progressRoutes from "./routes/progress.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173", "http://localhost:8080", "http://localhost:8081"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Trop de requêtes",
});

app.use("/api/", limiter);

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get("/", (req, res) => {
  res.json({
    message: "API Coach Fit Squad Builder",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      clients: "/api/clients",
      programs: "/api/programs",
      sessions: "/api/sessions",
      progress: "/api/progress",
    },
  });
});

app.get("/api/health", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  res.json({
    status: "OK",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/progress", progressRoutes);

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route non trouvée",
  });
});

app.use((err, req, res, next) => {
  console.error("Erreur:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Erreur serveur",
  });
});

const connectDB = async () => {
  try {
    console.log("Connexion à MongoDB...");
    const mongoURI =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/coach-fit-squad-builder";
    await mongoose.connect(mongoURI);
    console.log("MongoDB connecté");
  } catch (error) {
    console.error("Erreur MongoDB:", error.message);
  }
};

mongoose.connection.on("disconnected", () => console.log("MongoDB déconnecté"));
mongoose.connection.on("error", (err) => console.error("Erreur MongoDB:", err));

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
  });
};

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export default app;
