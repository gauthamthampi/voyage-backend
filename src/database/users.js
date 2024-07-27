import mongoose from "mongoose"
import dotenv from 'dotenv';
import bcrypt from 'bcrypt'
dotenv.config();
const { Schema } = mongoose;


const addressSchema = new Schema({
    houseNo: { type: String, required: true },
    street: { type: String, required: true },
    district: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  });

const userschema = new mongoose.Schema({
    name:{
        type: String,
    },
    email:{
        type: String,
        unique: true
    },
    mobile:{
        type: Number,
    },
    gender:{
        type:String
    },
    profilePic:{
        type:String
    },
    password:{
        type: String,
    },
    address: addressSchema,
    isBlocked:{
       type: Boolean,
       default: false
    },
    nationality : {
        type: String,
    },
    dob: {
        type:Date
    },
    coupons:[{
        name:{
            type:String
        },
        description:{
            type:String
        },
        expirydate:{
            type:Date
        },
        discount:{
            type:Number
        }
    }],
    wallet:{
        type:Number,
        default:0
    },
    wallethistory:[{
        amount:{
            type:Number,
        },
        date:{
            type:Date,
        },
        status:{
            type:String,
        }
    }],
    isAdmin:{
        type:Boolean,
        default:false
    },
    premium:{
        type:Boolean,
        default:false
    },
    nationality:{
        type:String
    },
    age:{
        type:Number,
    },
    premiumDate:{
        type:Date,
        default:null
    },
    dob:{
        type:Date,
    },
    googleEntry:{
        type:Boolean,
        default:false
    },
});

userschema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });


const usercollection = new mongoose.model("Users",userschema);
export default usercollection;