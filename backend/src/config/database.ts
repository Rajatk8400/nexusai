import mongoose from "mongoose";
import { createLogger } from "./logger";

const log = createLogger("Database");

export async function connectDB(): Promise<void> {
  const uri = process.env["MONGODB_URI"];
  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  try {
    // Add connection options for better reliability
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });
    log.info("✅ MongoDB connected", { 
      host: mongoose.connection.host, 
      db: mongoose.connection.name 
    });
  } catch (err) {
    log.error("❌ MongoDB connection failed", { error: err });
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

mongoose.connection.on("error", (err) => {
  createLogger("Database").error("MongoDB error", { error: err });
});

mongoose.connection.on("disconnected", () => {
  createLogger("Database").warn("MongoDB disconnected");
});

mongoose.connection.on("connected", () => {
  createLogger("Database").info("MongoDB connected successfully");
});