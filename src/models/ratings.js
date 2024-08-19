import mongoose from "mongoose"
import dotenv from 'dotenv';
dotenv.config();
const { Schema } = mongoose;


const ratingSchema = new mongoose.Schema({
    userEmail: {
      type: String,
    },
    bookingId:{
        type:  mongoose.Schema.Types.ObjectId,
        ref : 'Bookings'
    },
    propertyId:{
         type:  mongoose.Schema.Types.ObjectId,
         ref : 'Properties'
    },
    rating:{
        location:{
            type:Number
        },
        cleanliness:{
            type:Number
        },
        facilities:{
            type:Number
        },
        service:{
            type:Number
        },
        average:{
            type:Number
        }
    },
    review:{
        type:String
    }
  });

  ratingSchema.pre('save', function (next) {
    if (this.rating.location && this.rating.cleanliness && this.rating.facilities && this.rating.service) {
      const total = this.rating.location + this.rating.cleanliness + this.rating.facilities + this.rating.service;
      this.rating.average = total / 4;
    }
    next();
  });

const ratingcollection = new mongoose.model("Ratings",ratingSchema);
export default ratingcollection;