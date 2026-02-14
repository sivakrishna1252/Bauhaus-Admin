import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads/projects';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // ALLOW IMAGES, VIDEOS and PDF
        const filetypes = /jpeg|jpg|png|webp|mp4|webm|mov|pdf/;
        const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/pdf';
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images, videos and PDFs are allowed (jpg, png, mp4, pdf, etc.)'));
    },
    limits: { fileSize: 50 * 1024 * 1024 }, // Increased to 50MB for videos
});

export default upload;
