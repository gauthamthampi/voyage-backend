import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import usercollection from '../models/users.js';
import destinationcollection from '../models/destinations.js';
import propertycollection from "../models/properties.js";
import upload from '../middleware/multer.js';
import { response } from 'express';

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
        const coverPhoto = req.file.filename; // The file is saved with this filename

        // Save the destination details to your database
        const newDestination = new destinationcollection({
          name,
          description,
          coverPhoto,
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

        // Update fields
        destination.name = name || destination.name;
        destination.description = description || destination.description;
        destination.bestSeason = bestSeason || destination.bestSeason;
        destination.thingsToDo = thingsToDo ? JSON.parse(thingsToDo) : destination.thingsToDo;

        // Update cover photo if a new file is uploaded
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
