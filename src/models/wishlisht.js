import mongoose from "mongoose"
import dotenv from 'dotenv';
import bcrypt from 'bcrypt'
dotenv.config();
const { Schema } = mongoose;


const wishlistSchema = new mongoose.Schema({
    userEmail: {
      type: String,
      required: true
    },
    wishlist: [{
      propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Properties'
      }
    }]
  });

const wishlistcollection = new mongoose.model("Wishlists",wishlistSchema);
export default wishlistcollection;