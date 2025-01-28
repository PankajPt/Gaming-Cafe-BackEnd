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

const uploadUserFile = multer(
    { 
        storage: storage,
        fileFilter: (_, file, cb) => {
            // include valid image extensions
            if (!allowedTypes.includes(file.mimetype)) {
              return cb(new Error('Only JPEG and PNG files are allowed!'), false);
            }
            cb(null, true);
          },
        limits: { fileSize: 3 * 1024 * 1024 }
    }
);
const uploadAdminFile = multer(
    { 
    storage: storage,
    fileFilter: (_, file, cb) => {
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error('Only JPEG and PNG files are allowed!'), false);
        }
        cb(null, true);
      },
    limits: { fileSize: 5 * 1024 * 1024 }
    }
);
export { uploadUserFile, uploadAdminFile }