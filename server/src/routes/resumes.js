import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  getResumes, 
  getResumeById, 
  createResume, 
  updateResume, 
  deleteResume, 
  searchResumes,
  getResumeFile 
} from '../controllers/resumeController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Error handling middleware for file uploads
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'File too large',
        message: 'File size exceeds the 10MB limit.'
      });
    }
    return res.status(400).json({ 
      error: 'File upload error',
      message: err.message 
    });
  } else if (err) {
    // An unknown error occurred
    console.error('File upload error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process file upload.'
    });
  }
  // No errors, proceed to the next middleware
  next();
};

// GET /api/resumes - Get all resumes with pagination
router.get('/', getResumes);

// GET /api/resumes/search - Search resumes
router.get('/search', searchResumes);

// GET /api/resumes/:id - Get a specific resume by ID
router.get('/:id', getResumeById);

// POST /api/resumes - Create a new resume with optional file upload
router.post('/', 
  upload.single('file'), 
  handleUploadError,
  createResume
);

// PUT /api/resumes/:id - Update a resume
router.put('/:id', updateResume);

// DELETE /api/resumes/:id - Delete a resume
router.delete('/:id', deleteResume);

// GET /api/resumes/:id/file - Get the resume file for download
router.get('/:id/file', getResumeFile);

// Legacy route for backward compatibility
router.post('/upload', upload.single('file'), createResume);

export default router;
