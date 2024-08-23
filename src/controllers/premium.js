import userCollection from "../models/users.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import nodemailer from "nodemailer"
import destinationcollection from "../models/destinations.js";
import upload from '../middleware/multer.js';
import propertycollection from "../models/properties.js";
import bookingscollection from "../models/bookings.js";
import blogsCollection from "../models/blogs.js";


export const addProperty = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      res.status(400).json({ errors: { photos: err } });
      console.log(err);
    } else {
      if (req.files.length === 0) {
        res.status(400).json({ errors: { photos: 'No files selected' } });
      } else {
        const {
          name,
          description,
          latitude, 
          longitude, 
          destination,
          facilities,
          rooms,
          surroundings,
          email
        } = req.body;

        const location = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        };

        const photos = req.files.map(file => file.filename);

        const newProperty = new propertycollection({
          name,
          photos,
          description,
          location,
          destination,
          email,
          facilities: JSON.parse(facilities),
          rooms: JSON.parse(rooms),
          surroundings: JSON.parse(surroundings)
        });

        try {
          const savedProperty = await newProperty.save();
          res.status(201).json(savedProperty);
        } catch (error) {
          console.log(error);
          
          res.status(500).json({ errors: error });
        }
      }
    }
  });
};


  export const getDestinations = async (req, res) => {
    try {
      const destinations = await destinationcollection.find({}, 'name');
      res.status(200).json(destinations);
    } catch (error) {
      res.status(500).json({ errors: error });
    }
  };

  export const getUserProperties = async (req, res) => {
    const email = req.query.email;
    
    try {
      const properties = await propertycollection.find({ email });
      res.json(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).send('Server error');
    }
  }

  export const putPropertyEdit = async (req, res) => {
    try {
        upload(req, res, async function (err) {
            if (err) {
                return res.status(500).json({ message: 'Error uploading files', error: err });
            }

            const { id } = req.params;
            const { name, description, latitude, longitude, destination, email, facilities, rooms, surroundings } = req.body;
            const photos = req.files.map(file => file.filename);

            const property = await propertycollection.findById(id);
            if (!property) {
                return res.status(404).json({ message: 'Property not found' });
            }

            property.name = name;
            property.description = description;

            if (latitude && longitude) {
                property.location = {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude)
                };
            }

            property.destination = destination;
            property.email = email;
            property.facilities = JSON.parse(facilities);
            property.rooms = JSON.parse(rooms);
            property.surroundings = JSON.parse(surroundings);

            if (photos.length > 0) {
                property.photos = photos;
            }

            await property.save();

            res.status(200).json(property);
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

  
  export const putBlockProperty = async (req,res)=> {
    try{
      const {id} = req.params

      const property = await propertycollection.findById(id)
  
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
  
      property.status = false
      await property.save();
      res.status(200).json(property);  
    }catch(error){
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
  
  export const getPropertyBookingDetails = async (req, res) => {
    try {
      const { userEmail } = req.query;
      if (!userEmail) {
        return res.status(400).json({ success: false, message: 'User email is required' });
      }
      
      const properties = await propertycollection.find({ email: userEmail });
      
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

  export const markBookingCompleted = async(req,res)=>{
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required' });
    }
  
    try {
      const booking = await bookingscollection.findByIdAndUpdate(
        bookingId,
        { status: 'Completed' },
        { new: true } 
      );
  
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
  
      res.status(200).json({ success: true, message: 'Booking marked as completed', booking });
    } catch (error) {
      console.error('Error marking booking as completed:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  export const getDashboard = async (req, res) => {
    const { userEmail } = req.query;
    try {
      const properties = await propertycollection.find({ email: userEmail });
  
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
      console.log(error);
      
      res.status(500).json({ error: 'Server Error' });
    }
  }
  
  export const createBlog = async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err });
      }
  
      const { title, content, writer } = req.body;
  
      if (!title || !content || !writer) {
        return res.status(400).json({ error: 'Title, content, and writer are required.' });
      }
  
      let photo = '';
  
      if (req.files && req.files.length > 0) {
        photo = req.files[0].filename;  
      }
  
      try {
        const newBlog = new blogsCollection({
          title,
          content,
          writer,
          photos: photo, 
          likes: 0,
          saved: 0,
        });
  
        const savedBlog = await newBlog.save();
        res.status(201).json(savedBlog);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create blog' });
      }
    });
  };
  
  export const getBlogsByUser = async (req, res) => {
    const { email } = req.query;
  
    try {
      const blogs = await blogsCollection.find({ writer: email });
      res.status(200).json(blogs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch blogs.' });
    }
  };

  export const updateBlog = async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err });
      }
  
      const { title, content, writer } = req.body;
      const {blogId} = req.params;
  
      if (!title || !content || !writer) {
        return res.status(400).json({ error: 'Title, content, and writer are required.' });
      }
  
      try {
        const existingBlog = await blogsCollection.findById(blogId);
        if (!existingBlog) {
          return res.status(404).json({ error: 'Blog not found' });
        }
  
        let photo = existingBlog.photos;
  
        if (req.files && req.files.length > 0) {
          photo = req.files[0].filename; 
        }
  
        const updatedBlog = await blogsCollection.findByIdAndUpdate(
          blogId,
          { title, content, writer, photos: photo, updatedAt: new Date() },
          { new: true }
        );
  
        res.status(200).json(updatedBlog);
      } catch (error) {
        res.status(500).json({ error: 'Failed to update blog' });
      }
    });
  };
  
  
  

  export const deleteBlog = async (req, res) => {
    const { blogId } = req.params; // Get blog ID from the URL
  
    if (!blogId) {
      return res.status(400).json({ error: 'Blog ID is required.' });
    }
  
    try {
      const deletedBlog = await blogsCollection.findByIdAndDelete(blogId);
  
      if (!deletedBlog) {
        return res.status(404).json({ error: 'Blog not found' });
      }
  
      res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete blog' });
    }
  };
  
  
  