import express from 'express';
import multer from 'multer';
import { 
  getResumes, 
  getResumeById, 
  createResume, 
  updateResume, 
  deleteResume, 
  searchResumes 
} from '../controllers/resumeController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// GET /api/resumes - Get all resumes with pagination
router.get('/', getResumes);

// GET /api/resumes/search - Search resumes
router.get('/search', searchResumes);

// GET /api/resumes/:id - Get a specific resume by ID
router.get('/:id', getResumeById);

// POST /api/resumes - Create a new resume
router.post('/', upload.single('file'), createResume);

// PUT /api/resumes/:id - Update a resume
router.put('/:id', updateResume);

// DELETE /api/resumes/:id - Delete a resume
router.delete('/:id', deleteResume);

// Legacy route for backward compatibility
router.post('/upload', upload.single('file'), createResume);

export default router;
