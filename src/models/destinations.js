import mongoose from "mongoose"
import dotenv from 'dotenv';
import bcrypt from 'bcrypt'
dotenv.config();
const { Schema } = mongoose;


const destinationschema = new mongoose.Schema({
    name:{
        type: String,
    },
    photos:{
        type: String,
    },
    description:{
        type: String,
    },
    bestSeason:{
        type: String,
    },
    thingsToDo:[{
        place:{
            type:String,
        },
        description:{
            type:String
        }
    }],
    status:{
        type:Boolean,
        default:true
    }

   
});

const destinationcollection = new mongoose.model("Destinations",destinationschema);
export default destinationcollection;