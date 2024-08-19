import express from "express"
const premrouter = express.Router();
import {addProperty,getDestinations,getUserProperties,putPropertyEdit,putBlockProperty, 
       getPropertyBookingDetails, markBookingCompleted, getDashboard, createBlog,
       getBlogsByUser,
       updateBlog,
       deleteBlog} from '../controllers/premium.js'
import checkBlocked from "../middleware/checkBlock.js";

premrouter.post('/property/addProperty',checkBlocked,addProperty)
premrouter.get('/getDestinations',getDestinations)
premrouter.get('/getUserProperties',checkBlocked,getUserProperties)
premrouter.put('/property/updateProperty/:id',checkBlocked,putPropertyEdit)
premrouter.put("/property/blockProperty/:id",checkBlocked,putBlockProperty)
premrouter.get("/api/property/getPropertyBookingDetails",getPropertyBookingDetails)
premrouter.post("/api/markBookingCompleted",checkBlocked,markBookingCompleted)
premrouter.get('/api/property/Dashboard',getDashboard)
premrouter.post('/api/blogs/create',createBlog)
premrouter.get('/api/premium/blogs',getBlogsByUser)
premrouter.put('/api/blogs/update/:blogId',updateBlog)
premrouter.delete('/api/blogs/delete/:blogId',deleteBlog)
export default premrouter
