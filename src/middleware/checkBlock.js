import jwt from 'jsonwebtoken'
import usercollection from '../models/users.js';

const checkBlocked = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) return res.sendStatus(401);
  
    try {
      const decoded = jwt.verify(token, 'secretkey');
      const email = decoded.email;
  
      const user = await usercollection.findOne({ email });
  
      if (!user) return res.sendStatus(404);
  
      if (user.isBlocked) {
        return res.status(401).json({ message: 'User is blocked. Please contact support.' });
      }
  
      req.user = user;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired. Please log in again.' });
      }
      return res.sendStatus(403);
    }
  };
  

export default checkBlocked
