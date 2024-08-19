import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const { Schema } = mongoose;

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true }, 
    description: { type: String, required: true }, 
    discountValue: { type: Number, required: true }, 
    minPurchaseAmount: { type: Number, default: 0 }, 
    timesUsed: { type: Number, default: 0 }, 
    isActive: { type: Boolean, default: true }, 
    timestamp: { type: Date, default: Date.now }
});

const couponCollection = new mongoose.model('Coupons',couponSchema)
export default couponCollection