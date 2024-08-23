import userCollection from "../models/users.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import nodemailer from "nodemailer"
import destinationcollection from "../models/destinations.js";
import propertycollection from "../models/properties.js";
import wishlistcollection from "../models/wishlisht.js";
import {upload,deleteOldProfilePicture} from "../middleware/aws-s3.js";
import bookingscollection from "../models/bookings.js";
import ratingcollection from "../models/ratings.js";
import mongoose from "mongoose";
import blogsCollection from "../models/blogs.js";
import couponCollection from "../models/coupon.js";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL, 
    pass: process.env.PASSWORD, 
  },
});

const temporaryUserData = {};

export const signupPost = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await userCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    temporaryUserData[email] = { name, email, password, otp };


    let mailOptions = {
      from: process.env.EMAIL, 
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

    delete temporaryUserData[email];

    res.status(200).json({ message: 'User verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP. Please try again later.' });
    console.log(error);
  }
};


export const premiumUpdation =  async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await userCollection.findOne({email:email});
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.premium = true;
    user.premiumDate = new Date();
    
    const welcomeCoupons = await couponCollection.find({ type: 'welcome' });

    welcomeCoupons.forEach(coupon => {
      const existingCoupon = user.coupons.find(c => c.id === coupon._id.toString());
      if (!existingCoupon) {
        user.coupons.push({ id: coupon._id.toString(), quantity: 1 });
      }
    });

    await user.save();
    res.status(200).json({ message: 'Premium subscription updated and welcome coupons added successfully',success:true });
  } catch (error) {
    console.error('Error updating premium subscription:', error);
    res.status(500).json({ message: 'Internal server error' });
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
    
    const token = jwt.sign({ email: user.email }, 'secretkey', { expiresIn: '24h' });
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
    const filter = { status: true }; 
    
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
      const propertyExists = wishlist.wishlist.some(item => item.propertyId === propertyId);
      
      if (!propertyExists) {
        wishlist.wishlist.push({ propertyId });
        await wishlist.save();
        res.status(200).json({ message: "Property added to wishlist" });
      } else {
        res.status(200).json({ message: "Property already in wishlist" });
      }
    } else {
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

export const getUserCouponsProfile =  async (req, res) => {
  try {
    const userEmail = req.query.email;
    const user = await userCollection.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const couponIds = user.coupons.map(coupon => coupon.id);
    const couponDetails = await couponCollection.find({ _id: { $in: couponIds } });

    // Attach the quantity from user coupons to the corresponding coupon details
    const couponsWithQuantity = couponDetails.map(coupon => {
      const userCoupon = user.coupons.find(c => c.id === coupon._id.toString());
      return {
        ...coupon.toObject(), // Convert Mongoose document to plain object
        quantity: userCoupon ? userCoupon.quandity : 0 // Attach the quantity from user data
      };
    });

    res.status(200).json(couponsWithQuantity);
  } catch (error) {
    console.error('Error fetching user coupons:', error);
    res.status(500).json({ message: 'Internal server error' });
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
      { 'rooms.$': 1 }  
    );

    if (!hotelDetails || hotelDetails.rooms.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const roomDetails = hotelDetails.rooms[0];  

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


export const createBooking = async (req, res) => {
  try {
      const {
          userName,
          mobile,
          userEmail,
          paymentId,
          paymentMethod,
          paymentDate,
          paymentStatus,
          noofdays,
          propertyId,
          checkInDate,
          checkOutDate,
          travellers,
          rooms,
          roomId,
          amount,
          bookingDate,
          coupon
      } = req.body;
      

      if (!userName || !mobile || !userEmail || !propertyId || !checkInDate || !checkOutDate || !noofdays || !amount) {
          return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
      
      const newBooking = new bookingscollection({
          userName,
          mobile,
          userEmail,
          propertyId,
          checkInDate,
          checkOutDate,
          travellers,
          noofdays,
          room: [{ roomId, quantity: rooms }],
          payment: [{
              method: paymentMethod,
              paymentId,
              status: paymentStatus,
              date: paymentDate,
              amountPaid: amount
          }],
          bookingDate,
          amount,
          coupon
      });

      await newBooking.save();

      const applicableCoupons = await couponCollection.find({
          isActive: true,
          minPurchaseAmount: { $lte: amount }
      });

      if (applicableCoupons.length > 0) {
          const user = await userCollection.findOne({ email: userEmail });

          if (user) {
              applicableCoupons.forEach(coupon => {
                  const existingCoupon = user.coupons.find(c => c.id === coupon._id.toString());

                  if (existingCoupon) {
                      existingCoupon.quandity += 1;
                  } else {
                      user.coupons.push({
                          id: coupon._id.toString(),
                          quandity: 1
                      });
                  }
              });

              await user.save();
          }
      }

      res.status(201).json({ success: true, message: 'Booking created successfully', booking: newBooking });
  } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const { userEmail, page = 1, limit = 10 } = req.query;

    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }

    const skip = (page - 1) * limit;

    const bookings = await bookingscollection
      .find({ userEmail })
      .populate('propertyId') 
      .populate('room.roomId')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBookings = await bookingscollection.countDocuments({ userEmail });

    res.status(200).json({ 
      success: true, 
      bookings,
      totalBookings,
      currentPage: page,
      totalPages: Math.ceil(totalBookings / limit)
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const getBookingDetails = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = await bookingscollection.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfileBookings = async (req, res) => {
  const { userEmail, limit } = req.query;
  
  try {
    const bookings = await bookingscollection
      .find({ userEmail: userEmail })
      .limit(parseInt(limit, 10))
      .populate('propertyId'); 

    const bookingsWithPropertyDetails = await Promise.all(
      bookings.map(async (booking) => {
        const property = await propertycollection.findById(booking.propertyId);
        return {
          ...booking.toObject(),
          property
        };
      })
    );

    res.json(bookingsWithPropertyDetails);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).send('Server Error');
  }
};

export const cancelBookingProfile = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await bookingscollection.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).send('Server Error');
  }
};

export const getAddRating = async (req, res) => {
  const { userEmail, propertyId, bookingId, rating, review } = req.body;
  try {
    const newRating = new ratingcollection({
      userEmail,
      bookingId,
      propertyId,
      rating,
      review,
    });
    await newRating.save();
    await bookingscollection.findByIdAndUpdate(bookingId, { ratingSubmission: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.json({ success: false });
  }
}

export const fetchPropertyRatings = async (req, res) => {
  const { id } = req.params;
  try {
      const ratings = await ratingcollection.find({ propertyId: id }).lean();

      if (!ratings.length) {
        return res.status(400).json({ message: "No ratings found" });
      }

      const ratingsWithUserDetails = await Promise.all(ratings.map(async (rating) => {
          const user = await userCollection.findOne({ email: rating.userEmail }).lean();
          return {
              ...rating,
              userName: user ? user.name : 'Anonymous',
              userPhoto: user ? user.profilePic : 'default',
          };
      }));

      res.json(ratingsWithUserDetails);
  } catch (error) {
      console.error('Error fetching ratings:', error);
      res.status(500).json({ error: 'Failed to fetch ratings' });
  }
}

export const getAvailableFilteredProperties = async (req, res) => {
  const { checkInDate, checkOutDate } = req.query;
  
  if (!checkInDate || !checkOutDate) {
    return res.status(400).json({ message: 'Check-in and check-out dates are required' });
  }

  try {
    const from = new Date(checkInDate);
    const to = new Date(checkOutDate);

    if (from >= to) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    if (from <= new Date() || to <= new Date()) {
      return res.status(400).json({ message: 'Dates must be in the future' });
    }

    const properties = await propertycollection.find().populate('rooms');
    const availableProperties = [];

    for (const property of properties) {
      let available = true;
      
      for (const room of property.rooms) {
        const overlappingBookings = await bookingscollection.find({
          propertyId: property._id,
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

        const roomCapacity = room.availability;
        let totalBookedRooms = overlappingBookings.reduce((acc, booking) => {
          let bookedRoom = booking.room.find(r => r.roomId.toString() === room._id.toString());
          return acc + (bookedRoom ? bookedRoom.quantity : 0);
        }, 0);

        if (totalBookedRooms + 1 > roomCapacity) {
          available = false;
          break;
        }
      }

      if (available) {
        availableProperties.push(property);
      }
    }

    res.status(200).json(availableProperties);
  } catch (error) {
    console.error('Error fetching available properties:', error);
    res.status(500).json({ message: 'Error fetching available properties', error });
  }
};

export const getAllBlogs =  async (req, res) => {
  try {
    const blogs = await blogsCollection.find({});
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const getArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await blogsCollection.findById(id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const writer = await userCollection.findOne({ email: article.writer });
    
    if (!writer) {
      return res.status(404).json({ message: 'Writer not found' });
    }

    const response = {
      ...article.toObject(),
      writerName: writer.name,
      writerPhoto: writer.profilePic, 
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getUserCoupons = async (req, res) => {
  try {
    const { userEmail } = req.query;

    const user = await userCollection.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const couponIds = user.coupons
    .filter(coupon => coupon.quandity >= 1)
    .map(coupon => coupon.id);
  
    const coupons = await couponCollection.find({ _id: { $in: couponIds } , isActive:true});

    return res.status(200).json({ success: true, coupons });
  } catch (error) {
    console.error('Error fetching user coupons:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const getPropertyRatings = async (req, res) => {
  try {
      const { propertyId } = req.params;

      const result = await ratingcollection.aggregate([
          { $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } },
          {
              $group: {
                  _id: null,
                  averageLocation: { $avg: "$rating.location" },
                  averageCleanliness: { $avg: "$rating.cleanliness" },
                  averageFacilities: { $avg: "$rating.facilities" },
                  averageService: { $avg: "$rating.service" },
                  overallAverage: { $avg: "$rating.average" },
              }
          }
      ]);

      if (result.length === 0) {
          return res.status(404).json({ message: 'No ratings found for this property' });
      }

      const averages = {
          location: result[0].averageLocation,
          cleanliness: result[0].averageCleanliness,
          facilities: result[0].averageFacilities,
          service: result[0].averageService,
          overallAverage: result[0].overallAverage
      };

      res.json(averages);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
}

export const getCouponDetails = async(req,res)=>{
  try{
    const {id} = req.params

    const coupon = await couponCollection.findById(id)
    res.json(coupon)
  }catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
}
}