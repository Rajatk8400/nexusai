import mongoose from "mongoose";
import { User } from "./src/models/user.model";
import "dotenv/config";

async function promote() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const emails = ["rajat123@gmail.com", "rajat@gmail.com"];
  for (const email of emails) {
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: "SUPER_ADMIN", roleLevel: 100 },
      { new: true }
    );
    if (user) {
      console.log(`User ${email} promoted to SUPER_ADMIN`);
    } else {
      console.log(`User ${email} not found`);
    }
  }
  await mongoose.disconnect();
}

promote();
