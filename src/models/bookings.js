import mongoose from "mongoose"
import dotenv from 'dotenv';
import bcrypt from 'bcrypt'
dotenv.config();
const { Schema } = mongoose;


const bookingschema = new mongoose.Schema({
    userEmail:{
        type: String,
        ref: 'Users'
    },
    propertyId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Properties'
    },
    checkInDate:{
        type: Date
    },
    checkOutDate:{
        type: Date
    },
    noofdays:{
        type: Number
    },
    travellers:{
        type:Number
    },
    room:[{
        roomId:{
            type: mongoose.Schema.Types.ObjectId
        },
        quantity:{
            type: Number
        }
    }],
    payment:[{
        method:{
            type:String
        },
        paymentId:{
            type:String
        },
        status:{
            type:String
        },
        date:{
            type:Date
        },
        amountPaid:{
            type:Number
        }
    }],
    bookingDate:{
        type:Date
    },
    userName:{
        type:String
    },
    mobile:{
        type:Number
    },
    coupon:{
        id:{
            type:  mongoose.Schema.Types.ObjectId,
            ref : 'Coupons'
    }},
    status:{
        type:String,
        default:"Upcoming"
    },
    ratingSubmission:{
        type:Boolean,
        default:false
    }

});

const bookingscollection = new mongoose.model("Bookings",bookingschema);
export default bookingscollection;