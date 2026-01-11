import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SMVMonitoring } from './src/models/SMVMonitoring.js';

dotenv.config();

const checkYears = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const records = await SMVMonitoring.find({}, 'referenceYear lguId').lean();
    console.log("Found records:", records.length);
    records.forEach(r => {
      console.log(`- ID: ${r._id}, Year: ${r.referenceYear}, LGU: ${r.lguId}`);
    });
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkYears();
