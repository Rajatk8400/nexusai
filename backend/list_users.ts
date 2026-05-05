import mongoose from "mongoose";
import { User } from "./src/models/user.model";
import "dotenv/config";

async function listUsers() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const users = await User.find({}, "email role").limit(10);
  console.log(JSON.stringify(users, null, 2));
  await mongoose.disconnect();
}

listUsers();
