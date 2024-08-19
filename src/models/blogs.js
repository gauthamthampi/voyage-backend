import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const { Schema } = mongoose;


const blogsSchema = new mongoose.Schema({
    title: String,
    photos: String,
    content: String,
    writer: String,
    likes: Number,
    saved: Number,
    timestamp: { type: Date, default: Date.now }
  });
  

const blogsCollection = new mongoose.model('Blogs', blogsSchema);

export default blogsCollection;
