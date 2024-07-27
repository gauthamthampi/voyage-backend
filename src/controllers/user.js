import userCollection from "../database/users.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import nodemailer from "nodemailer"
import destinationcollection from "../database/destinations.js";
import propertycollection from "../database/properties.js";
import wishlistcollection from "../database/wishlisht.js";
import {upload,deleteOldProfilePicture} from "../middleware/aws-s3.js";
import bookingscollection from "../database/bookings.js";
import mongoose from "mongoose";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL, // Replace with your email
    pass: process.env.PASSWORD, // Replace with your email password
  },
});

const temporaryUserData = {};

export const signupPost = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the user already exists in the database
    const existingUser = await userCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    temporaryUserData[email] = { name, email, password, otp };


    let mailOptions = {
      from: process.env.EMAIL, // Replace with your email
      to: email,
      subject: 'OTP Verification for Voyage Account Registration',
      text: `Your OTP is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    console.log(otp);

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user. Please try again later.' });
  }
};


export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!temporaryUserData[email] || temporaryUserData[email].otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const { name, password } = temporaryUserData[email];

    const user = new userCollection({ name, email, password });
    await user.save();

    // Clear temporary storage
    delete temporaryUserData[email];

    res.status(200).json({ message: 'User verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP. Please try again later.' });
    console.log(error);
  }
};


  export const premiumUpdation = async (req, res) => {
  const { email } = req.body;
 
  try {
    const currentDate = new Date();
    const user = await userCollection.findOneAndUpdate(
      { email: email },
      { 
        premium: true,
        premiumDate: currentDate 
      },
      { new: true }
    );
    
    if (user) {
      res.status(200).json({ success: true, message: 'Premium status updated' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating premium status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

function differenceInMonths(date1, date2) {
  const diffInMilliseconds = Math.abs(date1 - date2);
  const diffInMonths = diffInMilliseconds / (1000 * 60 * 60 * 24 * 30); // Assuming 30 days per month
  return Math.round(diffInMonths);
}

export const cancelPremium = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await userCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const premiumDate = user.premiumDate;
    
    if (!premiumDate) {
      return res.status(400).json({ message: 'Premium start date not found' });
    }

   const diffInMonths = differenceInMonths(new Date(), premiumDate);

    const refundAmount = diffInMonths <= 6 ? 5000 : 0;

    await userCollection.updateOne(
      { email: email },
      { 
        premium: false,
        $inc:{wallet:refundAmount}
      }
    );

    res.status(200).json({success:true, message: 'Premium canceled successfully' });

  } catch (error) {
    console.error('Error canceling premium:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



export const loginPost = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userCollection.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if(user.isBlocked){
      return res.status(401).json({ message: 'Entry Restricted!' });
    }
    
    const token = jwt.sign({ email: user.email }, 'secretkey', { expiresIn: '1h' });
    return res.json({ 
      message: 'Login successful', 
      token, 
      email: user.email, 
      isPremium: user.premium 
    });

  } catch (err) {
    console.error('Error logging in:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


  export const createUserGoogle = async (req, res) => {
    const { email, firstname } = req.body;
  
    try {
      const userExist = await userCollection.findOne({ email });
  
      if (!userExist) {
        const user = await userCollection.create({
          email,
          firstname,
          googleEntry:true
        });
        const token = jwt.sign({ email: email }, 'secretkey', { expiresIn: '1h' });
        return res.status(201).json({  message: 'Login successful', token });
      } else {
        const token = jwt.sign({ email: email }, 'secretkey', { expiresIn: '1h' });
        return res.status(201).json({ message: 'User already exists',token });
    }
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

  export const getUserDetailsByEmail = async (req, res) => {
    try {
      const email = req.query.email; 
      const user = await userCollection.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  export const putupdateuser = async (req, res) => {
    try {
      const { email, ...fieldsToUpdate } = req.body;
  
      const user = await userCollection.findOneAndUpdate({ email }, fieldsToUpdate, { new: true });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error updating user', error });
    }
  };

  export const uploadProfilePicture = async (req, res) => {
    // Middleware to parse form data including files and other fields
    upload.single('profilePic')(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error uploading file', error: err });
      }
  
      const { email } = req.body;
      console.log(email + " email");
      
      const profilePicUrl = req.file.location;
      console.log('Uploaded file location:', profilePicUrl);
  
      try {
        const user = await userCollection.findOne({ email });
        if (!user) {
          console.warn('User not found:', email);
          return res.status(404).json({ message: 'User not found' });
        }
  
        console.log('User found:', user);
  
        await deleteOldProfilePicture(user.profilePic);
        user.profilePic = profilePicUrl;
        console.log('Updated user profile picture URL:', user.profilePic);
  
        await user.save();
        console.log('User saved successfully:', user);
  
        res.json(user);
      } catch (error) {
        console.error('Error updating user profile picture:', error);
        res.status(500).json({ message: 'Error updating user profile picture',  error });
      }
    });
  }; 
  
  
  export const getdestinationbyName = async (req, res) => {
    try {
      const destination = await destinationcollection.findOne({ name: req.params.name });
      if (!destination) {
        return res.status(404).json({ message: 'Destination not found' });
      }
      res.json(destination);
    } catch (error) {
      console.error('Error fetching destination:', error);
      res.status(500).json({ message: 'Failed to fetch destination' });
    }
  }

  export const getAllProperties = async (req, res) => {
    const { destination } = req.query;
    const filter = { status: true }; // Ensure only properties with status: true are returned
    
    if (destination) {
      filter.destination = destination;
    }
  
    try {
      const properties = await propertycollection.find(filter);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  

export const getPropertyDetailsById =  async (req, res) => {
  const { id } = req.params;
  try {
    const property = await propertycollection.findById(id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching property details' });
  }
}

export const checkWishlistStatus = async(req,res)=>{
  const { userEmail, propertyId } = req.query;

  try {
    const wishlist = await wishlistcollection.findOne({ userEmail, 'wishlist.propertyId': propertyId });

    res.status(200).json({ isInWishlist: !!wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Error checking wishlist status', error });
  }
}
  
export const toggleWishlistStatus = async(req,res)=>{
  const {userEmail,propertyId} = req.body
  try {
    let wishlist = await wishlistcollection.findOne({userEmail});
    if (wishlist) {
      // Check if the propertyId is already in the wishlist to avoid duplicates
      const propertyExists = wishlist.wishlist.some(item => item.propertyId === propertyId);
      
      if (!propertyExists) {
        wishlist.wishlist.push({ propertyId });
        await wishlist.save();
        res.status(200).json({ message: "Property added to wishlist" });
      } else {
        res.status(200).json({ message: "Property already in wishlist" });
      }
    } else {
      // Create a new wishlist for the user
      wishlist = new wishlistcollection({
        userEmail,
        wishlist: [{ propertyId }]
      });
      await wishlist.save();
      res.status(200).json({ message: "Wishlist created and property added" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error checking wishlist status', error });
  }
}

export const removeWishlist = async (req, res) => {
  const { userEmail, propertyId } = req.body;

  try {
    let wishlist = await wishlistcollection.findOne({ userEmail });

    if (wishlist) {
      // Filter out the propertyId from the wishlist
      wishlist.wishlist = wishlist.wishlist.filter(item => !item.propertyId.equals(propertyId));
      await wishlist.save();
      res.status(200).json({ isInWishlist: false, message: "Property removed from wishlist" });
    } else {
      res.status(404).json({ message: "Wishlist not found" });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error removing from wishlist', error });
  }
};

export const getWishlist = async (req, res) => {
  const { userEmail } = req.query;

  try {
    const wishlist = await wishlistcollection.findOne({ userEmail }).populate('wishlist.propertyId');
    if (!wishlist) return res.json([]);
    
    const properties = wishlist.wishlist.map(item => item.propertyId);
    res.json(properties);
  } catch (error) {
    console.error('Error fetching wishlist properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getUserdestinations = async (req, res) => {
  try {
    const destinations = await destinationcollection.find({ status: true });
    res.json(destinations);
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ message: 'Failed to fetch destinations' });
  }
}

export const postCheckAvailability = async (req, res) => {
  const { propertyId, roomCategory, checkInDate, checkOutDate, rooms, travellers } = req.body;
  if (typeof rooms !== 'number' || rooms < 1) {
    return res.status(400).json({ message: 'Rooms must be a number greater than or equal to 1' });
  }

  try {
    const from = new Date(checkInDate);
    const to = new Date(checkOutDate);

    if (from >= to) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    if (from <= new Date()) {
      return res.status(400).json({ message: 'Check-in date must be in the future' });
    }

    if (to <= new Date()) {
      return res.status(400).json({ message: 'Check-out date must be in the future' });
    }

    const overlappingBookings = await bookingscollection.find({
      propertyId: new mongoose.Types.ObjectId(propertyId),
      $or: [
        {
          checkInDate: { $lte: to },
          checkOutDate: { $gte: from }
        },
        {
          checkInDate: { $gte: from },
          checkOutDate: { $lte: to }
        }
      ]
    });

    const property = await propertycollection.findById(propertyId).populate('rooms');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const roomDetails = property.rooms.find(r => r.category === roomCategory);

    if (!roomDetails) {
      return res.status(404).json({ message: 'Room category not found' });
    }

    const roomCapacity = roomDetails.availability;
    const guestLimit = roomDetails.guests;

    let totalBookedRooms = overlappingBookings.reduce((acc, booking) => {
      let bookedRoom = booking.room.find(r => r.roomId.toString() === roomDetails._id.toString());
      return acc + (bookedRoom ? bookedRoom.quantity : 0);
    }, 0);

    const roomAvailability = totalBookedRooms + rooms <= roomCapacity;
    const guestCapacityMet = travellers <= guestLimit*rooms;

    const available = roomAvailability && guestCapacityMet;
    const message = available ? 'Rooms are available' : 'No rooms available for the selected dates or exceeded guest limit';

    res.status(200).json({ available, message });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ message: 'Error checking availability', error });
  }
};

export const getCheckoutHotelDetails = async (req, res) => {
  try {
    const { roomId } = req.query;

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    const hotelDetails = await propertycollection.findOne(
      { 'rooms._id': roomId },
      { 'rooms.$': 1 }  // Projection to return only the matching room
    );

    if (!hotelDetails || hotelDetails.rooms.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const roomDetails = hotelDetails.rooms[0];  // Extract the matching room

    const response = {
      hotel: {
        _id: hotelDetails._id,
        name: hotelDetails.name,
        destination: hotelDetails.destination,
      },
      room: roomDetails
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching hotel and room details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};