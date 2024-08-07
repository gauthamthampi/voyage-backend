import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const { Schema } = mongoose;


const messageSchema = new mongoose.Schema({
  senderEmail: String,
  receiverEmail: String,
  text: String,
  read: { type: Boolean, default: false }, 
  timestamp: { type: Date, default: Date.now }
});

const messageCollection = new mongoose.model('Message', messageSchema);

export default messageCollection;
