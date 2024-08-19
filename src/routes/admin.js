import express from "express"
const admrouter = express.Router();
import { adminloginpost,admingetcustomers,putblockuser,
    putunblockuser,adddestination,getdestinations,updateDestination,
     getAllProperties,putblockDestination,putunblockDestination,putblockProperty,putunblockProperty,
    getAdminBookingDetails, getAdminDashboard,getCoupons,addCoupon,
    hideCoupon,
    editCoupon} from "../controllers/admin.js";

admrouter.post("/adminlogin",adminloginpost)
admrouter.get("/admin/customers",admingetcustomers)
admrouter.put("/:userId/block",putblockuser)
admrouter.put("/:userId/unblock",putunblockuser)
admrouter.post("/admin/addDestination",adddestination)
admrouter.get("/admin/destinations",getdestinations)
admrouter.put("/admin/updateDestination/:id",updateDestination)
admrouter.get("/admin/getProperties",getAllProperties)
admrouter.put("/:id/blockDestination",putblockDestination)
admrouter.put("/:id/unblockDestination",putunblockDestination)
admrouter.put("/:id/blockProperty",putblockProperty)
admrouter.put("/:id/unblockProperty",putunblockProperty)
admrouter.get('/api/admin/getBookingDetails',getAdminBookingDetails)
admrouter.get('/api/admin/Dashboard',getAdminDashboard)
admrouter.get('/api/admin/getCoupons',getCoupons)
admrouter.post('/api/admin/addCoupon',addCoupon)
admrouter.put('/api/admin/hideCoupon/:id',hideCoupon)
admrouter.put('/api/admin/editCoupon/:id',editCoupon)


export default admrouter;
