import express from "express"
const router = express.Router();
import checkBlocked from "../middleware/checkBlock.js";
import { signupPost,loginPost,createUserGoogle,getUserDetailsByEmail,
         putupdateuser,verifyOtp,premiumUpdation,getdestinationbyName,getAllProperties
        ,getPropertyDetailsById,cancelPremium,checkWishlistStatus,toggleWishlistStatus,
         removeWishlist,getWishlist,getUserdestinations,uploadProfilePicture,postCheckAvailability,
        getCheckoutHotelDetails, createBooking, getUserBookings, getBookingDetails,getProfileBookings, 
        cancelBookingProfile, getAddRating,fetchPropertyRatings,  getAvailableFilteredProperties, 
        getAllBlogs, getArticle, getUserCoupons,
        getPropertyRatings,
        getCouponDetails}  from "../controllers/user.js";

router.post("/signup",signupPost)
router.post("/login",loginPost)
router.post("/googleauth_signup",createUserGoogle)
router.get("/user/getuser",checkBlocked,getUserDetailsByEmail)
router.put("/user/updateuser",checkBlocked,putupdateuser)
router.put("/user/uploadProfilePic",checkBlocked,uploadProfilePicture)
router.post("/verify-otp",verifyOtp)
router.post("/updatePremiumStatus",checkBlocked,premiumUpdation)
router.get("/destinations/:name",getdestinationbyName)
router.get("/api/getAllProperties",getAllProperties)
router.get("/api/getPropertyDetails/:id",getPropertyDetailsById)
router.put("/api/cancelPremium",checkBlocked,cancelPremium)
router.get("/api/check-wishlist",checkBlocked,checkWishlistStatus)
router.post("/api/toggle-wishlist",checkBlocked,toggleWishlistStatus)
router.post("/api/remove-from-wishlist",checkBlocked,removeWishlist)
router.get("/api/get-wishlist",checkBlocked,getWishlist)
router.get("/api/getUserDestinations",getUserdestinations)
router.post("/api/check-roomAvailability",checkBlocked, postCheckAvailability)
router.get("/api/checkout/getHotelDetails",checkBlocked,getCheckoutHotelDetails)
router.post("/api/createbooking",checkBlocked, createBooking)
router.get('/api/getUserBookings', checkBlocked,getUserBookings)
router.get('/api/getBookingDetails/:bookingId',getBookingDetails)
router.get('/api/userprofile/bookings',checkBlocked,getProfileBookings)
router.post('/api/userprofile/cancelbooking/:bookingId',checkBlocked,cancelBookingProfile)
router.post('/api/submitRating',checkBlocked,getAddRating)
router.get('/api/getRatings/:id',fetchPropertyRatings)
router.get('/api/getFilteredProperties',getAvailableFilteredProperties)
router.get('/api/allblogs',getAllBlogs)
router.get('/api/getArticle/:id',getArticle)
router.get('/api/getUserCoupons',getUserCoupons)
router.get('/api/property/:propertyId/average-rating',getPropertyRatings)
router.get('/api/getCouponDetails/:id',getCouponDetails)


export default router;
