import mongoose from "mongoose"
import dotenv from 'dotenv';
import bcrypt from 'bcrypt'
dotenv.config();
const { Schema } = mongoose;


const propertyschema = new mongoose.Schema({
    name:{
        type: String,
    },
    photos:[{
        type: String,
    }],
    description:{
        type: String,
    },
    location:{
        latitude:{
            type:Number
        },
        longitude:{
            type:Number
        }
    },
    status:{
        type: Boolean,
        default: true
    },
    
    destination:{
        type: String,
    },
    email:{
        type:String,
    },
    facilities:[{
        facility:{
            type:String,
        },
        svg:{
            type:String
        }
    }],
    rooms:[{
        category:{
            type:String,
        },
        guests:{
            type:Number
        },
        availability:{
            type:Number
        },
        price:{
            type:Number
        },
        offerprice:{
            type:Number
        }
    }],
    surroundings:[{
        category:{
            type:String
        },
        place:{
            type:String
        },
        distance:{
            type:Number
        }
    }]

   
});

const propertycollection = new mongoose.model("Properties",propertyschema);
export default propertycollection;