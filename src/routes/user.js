import express from "express"
const router = express.Router();
import { signupPost,loginPost,createUserGoogle,getUserDetailsByEmail,
         putupdateuser,verifyOtp,premiumUpdation,getdestinationbyName,getAllProperties
        ,getPropertyDetailsById,cancelPremium,checkWishlistStatus,toggleWishlistStatus,
         removeWishlist,getWishlist,getUserdestinations,uploadProfilePicture,postCheckAvailability,
        getCheckoutHotelDetails, createBooking,
        getUserBookings, getBookingDetails} 
         from "../controllers/user.js";

router.post("/signup",signupPost)
router.post("/login",loginPost)
router.post("/googleauth_signup",createUserGoogle)
router.get("/user/getuser",getUserDetailsByEmail)
router.put("/user/updateuser",putupdateuser)
router.put("/user/uploadProfilePic",uploadProfilePicture)
router.post("/verify-otp",verifyOtp)
router.post("/updatePremiumStatus",premiumUpdation)
router.get("/destinations/:name",getdestinationbyName)
router.get("/api/getAllProperties",getAllProperties)
router.get("/api/getPropertyDetails/:id",getPropertyDetailsById)
router.put("/api/cancelPremium",cancelPremium)
router.get("/api/check-wishlist",checkWishlistStatus)
router.post("/api/toggle-wishlist",toggleWishlistStatus)
router.post("/api/remove-from-wishlist",removeWishlist)
router.get("/api/get-wishlist",getWishlist)
router.get("/api/getUserDestinations",getUserdestinations)
router.post("/api/check-roomAvailability", postCheckAvailability)
router.get("/api/checkout/getHotelDetails",getCheckoutHotelDetails)
router.post("/api/createbooking", createBooking)
router.get('/api/getUserBookings', getUserBookings)
router.get('/api/getBookingDetails/:bookingId',getBookingDetails)


export default router;
