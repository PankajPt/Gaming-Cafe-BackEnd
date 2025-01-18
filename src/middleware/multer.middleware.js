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

const upload = multer({ storage: storage });
export default upload