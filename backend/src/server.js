import 'dotenv/config';import mongoose from 'mongoose';import app from './app.js';
const port=process.env.PORT||4000;mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/ironpeak').then(()=>app.listen(port,()=>console.log(`IronPeak API listening on ${port}`))).catch(err=>{console.error('MongoDB connection failed:',err.message);process.exit(1)});
