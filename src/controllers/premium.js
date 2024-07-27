import userCollection from "../database/users.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import nodemailer from "nodemailer"
import destinationcollection from "../database/destinations.js";
import upload from '../middleware/multer.js';
import propertycollection from "../database/properties.js";


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
            location,
            destination,
            facilities,
            rooms,
            surroundings,
            email
          } = req.body;
  
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
            res.status(500).json({ errors: error });
          }
        }
      }
    });
  };

  export const getDestinations = async (req, res) => {
    try {
      const destinations = await destinationcollection.find({}, 'name'); // Fetch only the names
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

  export const putPropertyEdit = async(req,res)=>{
    try {
      upload(req, res, async function (err) {
        if (err) {
          return res.status(500).json({ message: 'Error uploading files', error: err });
        }
  
        const { id } = req.params;
        const { name, description, location, destination, email, facilities, rooms, surroundings } = req.body;
        const photos = req.files.map(file => file.filename);
  
        const property = await propertycollection.findById(id);
        if (!property) {
          return res.status(404).json({ message: 'Property not found' });
        }
  
        property.name = name;
        property.description = description;
        property.location = location;
        property.destination = destination;
        property.email = email;
        property.facilities = JSON.parse(facilities);
        property.rooms = JSON.parse(rooms);
        property.surroundings = JSON.parse(surroundings);
  
        // Only update photos if new ones are uploaded
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
  