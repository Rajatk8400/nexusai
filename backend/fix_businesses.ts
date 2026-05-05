import mongoose from "mongoose";
import { Business } from "./src/models/business.model";
import "dotenv/config";

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const businesses = await Business.find({ 
    $or: [
      { shortId: { $exists: false } },
      { planStatus: { $exists: false } }
    ]
  });
  
  console.log(`Found ${businesses.length} businesses to fix`);
  
  for (const b of businesses) {
    const update: any = {};
    if (!b.shortId) update.shortId = `NX-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!b.planStatus) update.planStatus = b.plan || "TRIAL";
    
    await Business.findByIdAndUpdate(b._id, update);
    console.log(`Fixed business: ${b.name} (${update.shortId})`);
  }
  
  await mongoose.disconnect();
}

fix();
