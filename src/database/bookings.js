import mongoose from "mongoose"
import dotenv from 'dotenv';
import bcrypt from 'bcrypt'
dotenv.config();
const { Schema } = mongoose;


const bookingschema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    propertyId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Properties'
    },
    fromDate:{
        type: Date
    },
    toDate:{
        type: Date
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
        status:{
            type:Boolean
        },
        date:{
            type:Date
        }
    }],

});

const bookingscollection = new mongoose.model("Bookings",bookingschema);
export default bookingscollection;