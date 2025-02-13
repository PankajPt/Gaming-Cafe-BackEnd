import multer from 'multer'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Set the destination directory for uploaded files
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        // Set the file name for the uploaded file
        cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname);
    }
});

const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/heif',
  'image/heic',
  'image/svg+xml',
  'image/tiff',
  'image/vnd.microsoft.icon',
]

const fileFilter = (_, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type! Allowed: JPEG, PNG, GIF, BMP, WebP, HEIF, HEIC, SVG, TIFF, ICO'), false);
  }
  cb(null, true);
};

const uploadUserFile = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 }});
const uploadAdminFile = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 }});

export { uploadUserFile, uploadAdminFile }

// import multer from "multer"


// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, './public/temp')
//     },
//     filename: function (req, file, cb) {
//       // console.log(file)
//       cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname);
//     }
//   })
  
  
// export const upload = multer({ storage })