import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import usercollection from '../models/users.js';
import destinationcollection from '../models/destinations.js';
import propertycollection from "../models/properties.js";
import upload from '../middleware/multer.js';
import { response } from 'express';
import bookingscollection from '../models/bookings.js';
import couponCollection from '../models/coupon.js';

dotenv.config();

export const adminloginpost = (req, res) => {
  const { username, password } = req.body;

  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return res.status(400).json({ message: 'Invalid Details' });
  }

  const token = jwt.sign({ username }, 'mysecretkey', { expiresIn: '1h' });
  return res.json({ message: 'Login successful', token });
};

export const admingetcustomers = async(req,res) => {
  try {
    const customers = await usercollection.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const putblockuser = async(req, res) => {
  const { userId } = req.params;

  try {
    const user = await usercollection.findByIdAndUpdate(userId, { isBlocked: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export const putunblockuser = async(req, res) => {
  const { userId } = req.params;

  try {
    const user = await usercollection.findByIdAndUpdate(userId, { isBlocked: false });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// export const addDestination = async (req, res) => {
//   const { name, description, coverPhoto, bestSeason, thingsToDo } = req.body;

//   // Basic validation
//   if (!name || !description || !coverPhoto || !bestSeason || !thingsToDo) {
//     return res.status(400).json({
//       errors: {
//         name: !name ? 'Name is required' : '',
//         description: !description ? 'Description is required' : '',
//         coverPhoto: !coverPhoto ? 'Cover photo URL is required' : '',
//         bestSeason: !bestSeason ? 'Best season is required' : '',
//         thingsToDo: thingsToDo.map((item) => ({
//           place: !item.place ? 'Place is required' : '',
//           description: !item.description ? 'Description is required' : '',
//         })),
//       },
//     });
//   }

//   try {
//     const newDestination = new destinationcollection({
//       name,
//       description,
//       coverPhoto,
//       bestSeason,
//       thingsToDo,
//     });

//     await newDestination.save();
//     res.status(201).json(newDestination);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };

export const getdestinations = async (req, res) => {
  try {
    const destinations = await destinationcollection.find();
    res.json(destinations);
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ message: 'Failed to fetch destinations' });
  }
}


export const adddestination = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      res.status(400).json({ errors: [{ message: err }] });
      console.log(err);
    } else {
      if (req.file == undefined) {
        res.status(400).json({ errors: [{ message: 'No file selected' }] });
      } else {
        const { name, description, bestSeason, thingsToDo } = req.body;
        const photos = req.file.filename;
      
        const newDestination = new destinationcollection({
          name,
          description,
          photos, 
          bestSeason,
          thingsToDo: JSON.parse(thingsToDo),
        });

        try {
          const savedDestination = await newDestination.save();
          res.status(201).json(savedDestination);
        } catch (error) {
          res.status(500).json({ errors: [{ message: error.message }] });
        }
      }
    }
  });
}


export const updateDestination = async (req, res) => {
  const destinationId = req.params.id;

  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ errors: { coverPhoto: err } });
    } else {
      const { name, description, bestSeason, thingsToDo } = req.body;

      try {
        const destination = await destinationcollection.findById(destinationId);

        if (!destination) {
          return res.status(404).json({ error: 'Destination not found' });
        }

        destination.name = name || destination.name;
        destination.description = description || destination.description;
        destination.bestSeason = bestSeason || destination.bestSeason;
        destination.thingsToDo = thingsToDo ? JSON.parse(thingsToDo) : destination.thingsToDo;

        if (req.file) {
          destination.coverPhoto = req.file.filename;
        }

        const updatedDestination = await destination.save();
        res.status(200).json(updatedDestination);
      } catch (error) {
        res.status(500).json({ errors: error });
      }
    }
  });
};

export const getAllProperties = async(req,res)=>{
  try{
   const properties = await propertycollection.find()
    res.status(200).json(properties)
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

export const putblockDestination = async(req, res) => {
  const { id } = req.params;

  try {
    const destination = await destinationcollection.findByIdAndUpdate(id, { status: false });

    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    res.status(200).json({ message: 'Destination blocked successfully' });
  } catch (error) {
    console.error('Error blocking destination:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export const putunblockDestination = async(req, res) => {
  const { id } = req.params;

  try {
    const destination = await destinationcollection.findByIdAndUpdate(id, { status: true });

    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    res.status(200).json({ message: 'Destination unblocked successfully' });
  } catch (error) {
    console.error('Error blocking destination:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export const putblockProperty = async(req, res) => {
  const { id } = req.params;

  try {
    const property = await propertycollection.findByIdAndUpdate(id, { status: false });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.status(200).json({ message: 'Property blocked successfully' });
  } catch (error) {
    console.error('Error blocking destination:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export const putunblockProperty = async(req, res) => {
  const { id } = req.params;

  try {
    const property = await propertycollection.findByIdAndUpdate(id, { status: true });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.status(200).json({ message: 'Property blocked successfully' });
  } catch (error) {
    console.error('Error blocking destination:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export const getAdminBookingDetails = async (req, res) => {
  try {
    const properties = await propertycollection.find({});
    
    const propertyIds = properties.map(property => property._id);

    const bookings = await bookingscollection.find({ propertyId: { $in: propertyIds } })
      .populate('propertyId') 
      .populate('room.roomId');         
    
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching property booking details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAdminDashboard = async (req, res) => {
  try {
    const properties = await propertycollection.find({});
    
    const propertyIds = properties.map(property => property._id);
    
    const bookings = await bookingscollection.find({ propertyId: { $in: propertyIds } });
    
    const totalBookings = bookings.length;
    
    const totalGross = bookings.reduce((total, booking) => {
      return total + booking.payment.reduce((sum, payment) => sum + payment.amountPaid, 0);
    }, 0);
    
    const totalProfit = totalGross * 0.33;
    
    const monthlyBookings = bookings.reduce((acc, booking) => {
      const month = new Date(booking.bookingDate).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
    
    const chartData = Object.keys(monthlyBookings).map(month => ({
      month,
      bookings: monthlyBookings[month],
    }));
    
    const topHotels = properties.map(property => {
      const propertyBookings = bookings.filter(booking => String(booking.propertyId) === String(property._id));
      return {
        name: property.name,
        bookings: propertyBookings.length,
      };
    }).sort((a, b) => b.bookings - a.bookings).slice(0, 5);
    
    const trendingDestinations = properties.reduce((acc, property) => {
      acc[property.destination] = (acc[property.destination] || 0) + 1;
      return acc;
    }, {});
    
    const trendingDestinationsList = Object.keys(trendingDestinations).map(destination => ({
      name: destination,
      bookings: trendingDestinations[destination],
    })).sort((a, b) => b.bookings - a.bookings).slice(0, 5);
    
    res.json({
      properties: properties.length,
      totalBookings,
      totalGross,
      totalProfit,
      chartData,
      topHotels,
      trendingDestinations: trendingDestinationsList,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

export const getCoupons = async(req,res)=>{
  try {
    const coupons = await couponCollection.find({});
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const addCoupon = async(req,res)=>{
  try {
    const { code, description, discountValue, minPurchaseAmount } = req.body;

    const existingCoupon = await couponCollection.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon with this code already exists' });
    }
    
    const newCoupon = new couponCollection({
      code,
      description,
      discountValue,
      minPurchaseAmount,
    });
    await newCoupon.save();
    res.status(201).json(newCoupon);
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ message: error.message });
  }
}

export const editCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedCoupon = await couponCollection.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedCoupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json(updatedCoupon);
  } catch (error) {
    console.error('Error editing coupon:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const hideCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await couponCollection.findById(id);

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    coupon.isActive = !coupon.isActive; 
    await coupon.save();

    res.status(200).json(coupon);
  } catch (error) {
    console.error('Error hiding coupon:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};