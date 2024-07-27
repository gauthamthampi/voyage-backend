import express from "express"
const premrouter = express.Router();
import {addProperty,getDestinations,getUserProperties,putPropertyEdit,putBlockProperty} from '../controllers/premium.js'

premrouter.post('/property/addProperty',addProperty)
premrouter.get('/getDestinations',getDestinations)
premrouter.get('/getUserProperties',getUserProperties)
premrouter.put('/property/updateProperty/:id',putPropertyEdit)
premrouter.put("/property/blockProperty/:id",putBlockProperty)

export default premrouter
