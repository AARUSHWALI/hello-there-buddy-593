require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Make sure this is the service role key
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  }
});

// Upload resume file to Supabase Storage
const uploadResumeToStorage = async (file) => {
  console.log('Starting file upload to Supabase Storage...');
  console.log('File info:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path
  });

  try {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = `resumes/${fileName}`;

    console.log('Generated file path:', filePath);

    // Check if file exists and has content
    if (!fs.existsSync(file.path)) {
      throw new Error('Temporary file not found after upload');
    }

    const stats = fs.statSync(file.path);
    if (stats.size === 0) {
      throw new Error('Uploaded file is empty');
    }

    // Read the file as a buffer
    const fileBuffer = fs.readFileSync(file.path);
    console.log('File read successfully, size:', fileBuffer.length, 'bytes');

    // List all buckets to debug
    console.log('Listing all available buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      // Continue anyway - sometimes listBuckets fails due to permissions but upload might still work
      console.log('Continuing with upload despite bucket listing error...');
    } else {
      console.log('Available buckets:', buckets.map(b => b.name));
      const bucketExists = buckets.some(bucket => bucket.name === 'resume');
      if (!bucketExists) {
        console.error('Storage bucket "resume" not found in the list of available buckets');
        // Don't throw here, try to create the bucket or continue with upload
      } else {
        console.log('Found bucket "resume" in storage');
      }
    }

    console.log('Uploading file to Supabase Storage...');
    // Try to upload the file to Supabase Storage
    console.log(`Attempting to upload to bucket: resume, path: ${filePath}`);
    let uploadResponse;
    try {
      uploadResponse = await supabase.storage
        .from('resume')
        .upload(filePath, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.mimetype
        });
    } catch (uploadError) {
      console.error('Error during upload attempt:', uploadError);
      // Try to create the bucket if it doesn't exist
      try {
        console.log('Attempting to create the resume bucket...');
        const { data: createBucketData, error: createBucketError } = await supabase.storage
          .createBucket('resume', { public: true });
          
        if (createBucketError) {
          console.error('Error creating bucket:', createBucketError);
          throw new Error(`Failed to create storage bucket. Please ensure your service role key has storage admin permissions. Details: ${createBucketError.message}`);
        }
        
        console.log('Bucket created successfully, retrying upload...');
        // Retry the upload after creating the bucket
        uploadResponse = await supabase.storage
          .from('resume')
          .upload(filePath, fileBuffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.mimetype
          });
      } catch (bucketCreateError) {
        console.error('Failed to create bucket and upload file:', bucketCreateError);
        throw new Error(`Failed to upload file and create bucket. Please check your Supabase storage configuration. Details: ${bucketCreateError.message}`);
      }
    }
    
    const { data, error } = uploadResponse;

    // Clean up the temp file
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log('Temporary file deleted');
      }
    } catch (cleanupError) {
      console.warn('Failed to delete temporary file:', cleanupError);
    }

    if (error) {
      console.error('Error uploading to Supabase Storage:', error);
      throw error;
    }

    console.log('File uploaded successfully, getting public URL...');
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resume')
      .getPublicUrl(filePath);

    console.log('File upload completed successfully');
    return {
      success: true,
      fileName: file.originalname,
      filePath,
      publicUrl,
      mimeType: file.mimetype,
      size: file.size
    };
  } catch (error) {
    console.error('Error in uploadResumeToStorage:', error);
    
    // Clean up temp file if it exists
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
        console.log('Cleaned up temporary file after error');
      } catch (cleanupError) {
        console.error('Failed to clean up temporary file after error:', cleanupError);
      }
    }
    
    throw error;
  }
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.get('/', (req, res) => {
  res.send('Resume Parser API is running');
});

// Parse and store resume (with optional file upload)
app.post('/api/resume', upload.single('resumeFile'), async (req, res) => {
  console.log('Request received at /api/resume');
  console.log('Request headers:', req.headers);
  
  // Log the raw request body for debugging
  console.log('Raw request body:', req.body);
  
  // Log the file info if present
  if (req.file) {
    console.log('Uploaded file info:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });
  }
  
  // Parse the form data
  let formData = {};
  if (req.body.data) {
    try {
      // If data was sent as JSON string in form data
      formData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
    } catch (e) {
      console.error('Error parsing form data:', e);
      return res.status(400).json({
        success: false,
        message: 'Invalid form data format',
        error: e.message
      });
    }
  } else {
    // If no file was uploaded, the data might be in the request body directly
    formData = req.body;
  }
  
  console.log('Parsed form data:', JSON.stringify(formData, null, 2));
  console.log('Received request to /api/resume');
  console.log('Request headers:', req.headers);
  console.log('Request body keys:', Object.keys(req.body));
  console.log('File info:', req.file ? {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path
  } : 'No file uploaded');
  // If no file is uploaded but resume data is in the body, handle it
  if (!req.file && req.body && Object.keys(req.body).length > 0) {
    // If the body is a string (from form-data), parse it as JSON
    if (typeof req.body === 'string' || req.body instanceof String) {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON in request body'
        });
      }
    }
  } else if (req.file && req.body && typeof req.body === 'string') {
    // If there's a file and the body is a string, parse it as JSON
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      // If parsing fails, continue with the original body
    }
  }
  try {
    const resumeData = formData; // Use the parsed form data instead of req.body
    
    let fileData = null;
    
    // Handle file upload if present
    if (req.file) {
      try {
        console.log('Starting file upload process...');
        fileData = await uploadResumeToStorage(req.file);
        console.log('File upload successful:', fileData);
      } catch (error) {
        console.error('Error in file upload process:', {
          message: error.message,
          stack: error.stack,
          code: error.code,
          name: error.name
        });
        return res.status(500).json({
          success: false,
          message: 'Error uploading resume file',
          error: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }

    // Prepare the resume data for insertion
    const resumeToInsert = {
      // File data if uploaded
      ...(fileData && {
        original_filename: fileData.fileName,
        file_path: fileData.filePath,
        file_url: fileData.publicUrl,
        file_size: fileData.size,
        mime_type: fileData.mimeType
      }),
      // Personal Info
      name: resumeData.personalInfo?.name || '',
      email: resumeData.personalInfo?.email || '',
      phone: resumeData.personalInfo?.phone || '',
      address: resumeData.personalInfo?.address || '',
      summary: resumeData.personalInfo?.summary || '',
      
      // Arrays stored as JSONB
      education: resumeData.education || [],
      experience: resumeData.experience || [],
      skills: resumeData.skills || [],
      achievements: resumeData.achievements || [],
      projects: resumeData.projects || [],
      research_papers: resumeData.researchPapers || [],
      patents: resumeData.patents || [],
      books: resumeData.books || [],
      trainings: resumeData.trainings || [],
      workshops: resumeData.workshops || [],
      
      // Education Institutes
      ug_institute: resumeData.ugInstitute || '',
      pg_institute: resumeData.pgInstitute || '',
      phd_institute: resumeData.phdInstitute || '',
      
      // Metadata and Analytics
      longevity_years: resumeData.longevityYears || 0,
      number_of_jobs: resumeData.numberOfJobs || 0,
      average_experience: resumeData.averageExperience || 0,
      skills_count: resumeData.skillsCount || 0,
      achievements_count: resumeData.achievementsCount || 0,
      trainings_count: resumeData.trainingsCount || 0,
      workshops_count: resumeData.workshopsCount || 0,
      projects_count: resumeData.projectsCount || 0,
      research_papers_count: resumeData.researchPapersCount || resumeData.researchPapers?.length || 0,
      patents_count: resumeData.patentsCount || resumeData.patents?.length || 0,
      books_count: resumeData.booksCount || resumeData.books?.length || 0,
      is_jk: Boolean(resumeData.isJK),
      best_fit_for: resumeData.bestFitFor || ''
    };

    console.log('Preparing to insert resume data:', JSON.stringify(resumeToInsert, null, 2));
    
    // Insert the resume data
    const { data, error } = await supabase
      .from('resumes')
      .insert([resumeToInsert])
      .select();

    if (error) {
      console.error('Error inserting into database:', error);
      throw error;
    }
    
    console.log('Successfully inserted resume data:', data);

    res.status(201).json({
      success: true,
      message: 'Resume data stored successfully',
      resumeId: data[0].id
    });

  } catch (error) {
    console.error('Error storing resume data:', error);
    res.status(500).json({
      success: false,
      message: 'Error storing resume data',
      error: error.message
    });
  }
});

// Get all resumes (paginated)
app.get('/api/resumes', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { data: resumes, error, count } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: false })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: resumes,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resumes',
      error: error.message
    });
  }
});

// Get resume file by ID
app.get('/api/resume/file/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the resume data
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('file_path, file_url, mime_type, original_filename')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!resume || !resume.file_path) {
      return res.status(404).json({ message: 'Resume file not found' });
    }

    // Redirect to the file URL
    res.redirect(resume.file_url);
  } catch (error) {
    console.error('Error fetching resume file:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resume file',
      error: error.message
    });
  }
});

// Get resume by ID
app.get('/api/resume/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the resume data
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }


    // Format the response to match the expected format
    const formattedResume = {
      personalInfo: {
        name: resume.name,
        email: resume.email,
        phone: resume.phone,
        address: resume.address,
        summary: resume.summary
      },
      education: resume.education || [],
      experience: resume.experience || [],
      skills: resume.skills || [],
      achievements: resume.achievements || [],
      projects: resume.projects || [],
      researchPapers: resume.research_papers || [],
      patents: resume.patents || [],
      books: resume.books || [],
      trainings: resume.trainings || [],
      workshops: resume.workshops || [],
      ugInstitute: resume.ug_institute,
      pgInstitute: resume.pg_institute,
      phdInstitute: resume.phd_institute,
      longevityYears: resume.longevity_years,
      numberOfJobs: resume.number_of_jobs,
      averageExperience: resume.average_experience,
      skillsCount: resume.skills_count,
      achievementsCount: resume.achievements_count,
      trainingsCount: resume.trainings_count,
      workshopsCount: resume.workshops_count,
      projectsCount: resume.projects_count,
      researchPapersCount: resume.research_papers_count,
      patentsCount: resume.patents_count,
      booksCount: resume.books_count,
      isJK: resume.is_jk ? 1 : 0,
      bestFitFor: resume.best_fit_for,
      id: resume.id,
      fileInfo: resume.file_path ? {
        url: resume.file_url,
        name: resume.original_filename,
        size: resume.file_size,
        mimeType: resume.mime_type
      } : null,
      createdAt: resume.created_at,
      updatedAt: resume.updated_at
    };

    res.json(formattedResume);

  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resume',
      error: error.message
    });
  }
});

// Search resumes
app.get('/api/resumes/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const { data: resumes, error } = await supabase
      .from('resumes')
      .select('*')
      .or(`
        name.ilike.%${query}%,
        email.ilike.%${query}%,
        best_fit_for.ilike.%${query}%,
        ug_institute.ilike.%${query}%,
        pg_institute.ilike.%${query}%,
        skills.cs.["${query}"],
        achievements.cs.["${query}"],
        projects.cs.["${query}"],
        research_papers.cs.["${query}"],
        patents.cs.["${query}"],
        books.cs.["${query}"],
        trainings.cs.["${query}"],
        workshops.cs.["${query}"]
      `)
      .limit(20);

    if (error) throw error;

    res.json({
      success: true,
      data: resumes
    });
  } catch (error) {
    console.error('Error searching resumes:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching resumes',
      error: error.message
    });
  }
});

// Import database initializer
const { initializeDatabase } = require('./db-init');

// Start server
async function startServer() {
  // Initialize database
  const dbInitialized = await initializeDatabase();
  if (!dbInitialized) {
    console.warn('Warning: Database initialization had issues. The application may not work as expected.');
  }
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Start the application
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
