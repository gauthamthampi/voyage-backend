import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import dotenv from 'dotenv';
dotenv.config()



AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION, 
});

const s3 = new AWS.S3();


export const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME, 
    key: function (req, file, cb) {
      const timestamp = Date.now()
      // console.log(userEmail+"useremail");
      const fileExtension = file.originalname.split('.').pop();
      cb(null, `profilepictures/${timestamp}.${fileExtension}`); 
    },
  }),
});

export const deleteOldProfilePicture = async (oldProfilePicUrl) => {
  if (!oldProfilePicUrl) return;

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: oldProfilePicUrl.split('.com/')[1], // Extract the key from the URL
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error deleting old profile picture:', error);
  }
};


