import { supabase } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Upload file to Supabase Storage
const uploadFileToStorage = async (file) => {
  console.log('Starting file upload:', file.originalname);
  
  try {
    if (!file || !file.path) {
      throw new Error('No file or file path provided');
    }

    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = `resumes/${fileName}`;

    console.log('Preparing to upload file to Supabase:', {
      originalName: file.originalname,
      tempPath: file.path,
      size: file.size,
      mimeType: file.mimetype,
      destinationPath: filePath
    });

    // Ensure the bucket exists
    console.log('Checking if bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      throw new Error(`Failed to list storage buckets: ${bucketsError.message}`);
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'resume');
    if (!bucketExists) {
      console.log('Bucket does not exist, creating...');
      const { error: createBucketError } = await supabase.storage
        .createBucket('resume', { public: false });
      
      if (createBucketError) {
        console.error('Error creating bucket:', createBucketError);
        throw new Error(`Failed to create storage bucket: ${createBucketError.message}`);
      }
      console.log('Bucket created successfully');
    } else {
      console.log('Bucket already exists');
    }

    // Read the file as a buffer
    console.log('Reading file from disk...');
    const fileBuffer = fs.readFileSync(file.path);
    
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('File is empty or could not be read');
    }

    console.log('Uploading file to Supabase...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resume')
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.mimetype,
        duplex: 'half'
      });

    if (uploadError) {
      console.error('Error uploading file to Supabase:', uploadError);
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    console.log('File uploaded successfully, getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('resume')
      .getPublicUrl(filePath);

    // Clean up the temporary file
    try {
      console.log('Cleaning up temporary file...');
      fs.unlinkSync(file.path);
      console.log('Temporary file removed');
    } catch (cleanupError) {
      console.error('Error cleaning up temporary file:', cleanupError);
      // Don't fail the request if cleanup fails
    }

    const result = {
      original_filename: file.originalname,
      file_path: filePath,
      file_url: publicUrl,
      file_size: file.size,
      mime_type: file.mimetype,
      uploaded_at: new Date().toISOString()
    };

    console.log('File upload completed successfully:', result);
    return result;
  } catch (error) {
    console.error('Error in file upload process:', {
      error: error.message,
      stack: error.stack,
      file: file ? {
        originalname: file.originalname,
        path: file.path,
        size: file?.size,
        mimetype: file?.mimetype
      } : 'No file info'
    });
    throw error;
  }
};

// Get all resumes with pagination
export const getResumes = async (req, res) => {
  try {
    console.log('Fetching all resumes...');
    
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { data: resumes, error, count } = await supabase
      .from('resumes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) throw error;
    
    // Get API base URL from app.locals
    const apiBaseUrl = req.app.locals.API_BASE_URL || 'http://localhost:5000';
    
    // Transform the data to include full file URLs
    const resumesWithUrls = resumes.map(resume => ({
      ...resume,
      file_url: resume.file_path ? `${apiBaseUrl}/resumes/${resume.id}/file` : null
    }));
    
    res.json({
      success: true,
      data: resumesWithUrls,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error getting resumes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Search resumes
export const searchResumes = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,skills.cs.{"${query}"}`);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error searching resumes:', error);
    res.status(500).json({ error: 'Failed to search resumes' });
  }
};

// Get a specific resume by ID
export const getResumeById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Get API base URL from app.locals
    const apiBaseUrl = req.app.locals.API_BASE_URL || 'http://localhost:5000';
    
    // Add full file URL
    data.file_url = data.file_path ? `${apiBaseUrl}/resumes/${data.id}/file` : null;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting resume:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new resume
export const createResume = async (req, res) => {
  console.log('=== Starting createResume ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request file:', req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path
  } : 'No file uploaded');

  try {
    let resumeData = {};
    
    // Parse the JSON data from the form data
    if (req.body.data) {
      try {
        console.log('Parsing resume data from request body');
        resumeData = typeof req.body.data === 'string' 
          ? JSON.parse(req.body.data) 
          : req.body.data;
        
        // If personalInfo exists, extract its fields to the root level
        if (resumeData.personalInfo) {
          const { personalInfo, ...rest } = resumeData;
          resumeData = {
            ...personalInfo,
            ...rest
          };
        }
        
        console.log('Processed resume data:', JSON.stringify(resumeData, null, 2));
      } catch (e) {
        console.error('Error parsing resume data:', {
          error: e.message,
          stack: e.stack,
          data: req.body.data
        });
        return res.status(400).json({ 
          error: 'Invalid resume data format',
          details: e.message 
        });
      }
    } else {
      console.log('No resume data found in request body');
      // Try to get data from request body directly if not in data field
      const { data: bodyData, file, ...rest } = req.body;
      if (Object.keys(rest).length > 0) {
        resumeData = rest;
        console.log('Using data from request body:', JSON.stringify(resumeData, null, 2));
      }
    }
    
    // Handle file upload if present
    if (req.file) {
      console.log('Processing file upload...');
      try {
        const fileData = await uploadFileToStorage(req.file);
        console.log('File upload successful:', fileData);
        // Map file data to match database schema
        resumeData.original_filename = fileData.original_filename;
        resumeData.file_path = fileData.file_path;
        resumeData.file_url = fileData.file_url;
        resumeData.file_size = fileData.file_size;
        resumeData.mime_type = fileData.mime_type;
      } catch (error) {
        console.error('Error uploading file:', {
          error: error.message,
          stack: error.stack,
          file: req.file ? {
            originalname: req.file.originalname,
            path: req.file.path,
            size: req.file.size
          } : 'No file info'
        });
        return res.status(500).json({ 
          error: 'Failed to process file upload',
          details: error.message 
        });
      }
    } else {
      console.log('No file uploaded with the request');
    }

    console.log('Inserting resume data into database...');
    const { data: insertedData, error: dbError } = await supabase
      .from('resumes')
      .insert([resumeData])
      .select();

    if (dbError) {
      console.error('Database error:', {
        error: dbError,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code
      });
      throw new Error(`Database operation failed: ${dbError.message}`);
    }

    if (!insertedData || insertedData.length === 0) {
      throw new Error('No data returned from database after insert');
    }

    console.log('Resume created successfully:', JSON.stringify(insertedData[0], null, 2));
    
    // Get API base URL from app.locals
    const apiBaseUrl = req.app.locals.API_BASE_URL || 'http://localhost:5000';
    
    // Add file URL to the response
    const responseData = {
      ...insertedData[0],
      file_url: insertedData[0].file_path 
        ? `${apiBaseUrl}/resumes/${insertedData[0].id}/file` 
        : null
    };
    
    res.status(201).json({
      success: true,
      message: 'Resume created successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Unexpected error in createResume:', {
      error: error.message,
      stack: error.stack,
      request: {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: req.body,
        file: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : null
      }
    });
    
    res.status(500).json({ 
      error: 'Failed to create resume',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        details: error.details 
      })
    });
  } finally {
    console.log('=== End of createResume ===');
  }
};

// Update a resume
export const updateResume = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Handle file upload if present
    if (req.file) {
      const fileData = await uploadFileToStorage(req.file);
      updateData.file_data = fileData;
    }

    const { data, error } = await supabase
      .from('resumes')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error updating resume:', error);
    res.status(500).json({ error: 'Failed to update resume' });
  }
};

// Delete a resume
export const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
};

// Get resume file by ID
export const getResumeFile = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Getting file for resume ID: ${id}`);
    
    // Get resume data from database
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Check if file path exists
    if (!data.file_path) {
      return res.status(404).json({ success: false, error: 'No file associated with this resume' });
    }

    console.log(`File path in database: ${data.file_path}`);

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resume')
      .download(data.file_path);

    if (downloadError) {
      console.error('Error downloading file from Supabase:', downloadError);
      return res.status(404).json({ success: false, error: 'File not found in storage' });
    }

    if (!fileData) {
      return res.status(404).json({ success: false, error: 'File data is empty' });
    }

    // Get file extension and set content type
    const ext = path.extname(data.file_path).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.doc') contentType = 'application/msword';
    else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.txt') contentType = 'text/plain';

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(data.file_path)}"`);

    // Convert Blob to Buffer and send the response
    const buffer = await fileData.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error getting resume file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
