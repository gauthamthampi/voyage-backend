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
        type: Date
    },
    travellers:{
        type:Date
    },
    room:[{
        roomId:{
            type: mongoose.Schema.Types.ObjectId
        },
        quandity:{
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
    coupon:[{
        name:{
            type:String
        },
        discount:{
            type:Number
        }
    }]

});

const bookingscollection = new mongoose.model("Bookings",bookingschema);
export default bookingscollection;