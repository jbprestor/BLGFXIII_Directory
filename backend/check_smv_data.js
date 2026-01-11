import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SMVMonitoring } from './src/models/SMVMonitoring.js';
import { LGU } from './src/models/LGU.js';
import path from 'path';

dotenv.config();

const checkData = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("No MONGO_URI found in .env");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const lguCount = await LGU.countDocuments();
    const smvCount = await SMVMonitoring.countDocuments();

    console.log(`LGUs found: ${lguCount}`);
    console.log(`SMV Monitoring records found: ${smvCount}`);

    if (smvCount > 0) {
      const sample = await SMVMonitoring.findOne().populate('lguId', 'name');
      console.log("Sample SMV Record:", JSON.stringify(sample, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error("Error checking data:", error);
    process.exit(1);
  }
};

checkData();
