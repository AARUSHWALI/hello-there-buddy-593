import { supabase } from '../config/supabase.js'; 
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Promisify fs.unlink for cleaner async handling outside of uploadFileToStorage
const unlinkAsync = promisify(fs.unlink);

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

    // Note: Bucket 'resume' should be created manually in Supabase dashboard
    console.log('Assuming bucket "resume" exists (create it manually in Supabase dashboard if not)');

    // Read the file as a buffer
    console.log('Reading file from disk...');
    // Using sync read is okay here as it's a short-lived controller function
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
        // @ts-ignore
        duplex: 'half'
      });

    if (uploadError) {
      console.error('Error uploading file to Supabase:', uploadError);
      
      // Provide specific error messages for common issues
      if (uploadError.message.includes('Bucket not found')) {
        throw new Error('Storage bucket "resume" not found. Please create it in your Supabase dashboard under Storage.');
      }
      if (uploadError.message.includes('row-level security policy')) {
        throw new Error('Storage permissions error. Please check your Supabase RLS policies or use a service role key instead of anon key.');
      }
      
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    console.log('File uploaded successfully, getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('resume')
      .getPublicUrl(filePath);

    // Clean up the temporary file
    try {
      console.log('Cleaning up temporary file...');
      fs.unlinkSync(file.path); // Use sync method as it's safe after file is read
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

// Create/Update a resume (Modified to use UPSERT)
export const createResume = async (req, res) => {
  console.log('=== Starting createResume/updateResume (UPSERT) ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    let rawResumeData = {};
    
    // Parse the JSON data from the form data
    if (req.body.data) {
      try {
        console.log('Parsing resume data from request body');
        rawResumeData = typeof req.body.data === 'string' 
          ? JSON.parse(req.body.data) 
          : req.body.data;
        
        console.log('Processed raw resume data:', JSON.stringify(rawResumeData, null, 2));
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
      // Fallback if data is not in the 'data' field
      const { data: bodyData, file, ...rest } = req.body;
      if (Object.keys(rest).length > 0) {
        rawResumeData = rest;
        console.log('Using data from request body (fallback):', JSON.stringify(rawResumeData, null, 2));
      }
    }
    
    // Handle file upload if present
    let fileMetadata = {};
    if (req.file) {
      console.log('Processing file upload...');
      try {
        const fileData = await uploadFileToStorage(req.file);
        console.log('File upload successful:', fileData);
        fileMetadata = fileData;
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

    // --- START DB PAYLOAD ---
    // If the client sends resumeData.personalInfo, we pull fields from it.
    let dbPayload = {
      // Indexable/Queryable fields (MUST match table schema exactly)
      name: rawResumeData.personalInfo?.name || rawResumeData.name || null,
      email: rawResumeData.personalInfo?.email || rawResumeData.email || null, // Crucial for uniqueness
      phone: rawResumeData.personalInfo?.phone || rawResumeData.phone || null, 
      address: rawResumeData.personalInfo?.address || rawResumeData.address || null, 
      summary: rawResumeData.personalInfo?.summary || rawResumeData.summary || null, 
      ug_institute: rawResumeData.ug_institute || null,
      pg_institute: rawResumeData.pg_institute || null,
      phd_institute: String(rawResumeData.phd_institute || 0), 
      longevity_years: rawResumeData.longevity_years || 0,
      number_of_jobs: rawResumeData.number_of_jobs || 0,
      average_experience: rawResumeData.average_experience || 0,
      skills_count: rawResumeData.skills_count || 0,
      achievements_count: rawResumeData.achievements_count || 0,
      trainings_count: rawResumeData.trainings_count || 0,
      workshops_count: rawResumeData.workshops_count || 0,
      projects_count: rawResumeData.projects_count || 0,
      research_papers_count: rawResumeData.research_papers_count || 0,
      patents_count: rawResumeData.patents_count || 0,
      books_count: rawResumeData.books_count || 0,
      is_jk: (rawResumeData.is_jk || 0) === 1 ? 1 : 0, 
      best_fit_for: rawResumeData.best_fit_for || null,

      // JSONB fields
      education: rawResumeData.education || [],
      experience: rawResumeData.experience || [],
      skills: rawResumeData.skills || [],
      achievements: rawResumeData.achievements || [],
      projects: rawResumeData.projects || [],
      research_papers: rawResumeData.research_papers || [],
      patents: rawResumeData.patents || [],
      books: rawResumeData.books || [],
      trainings: rawResumeData.trainings || [],
      workshops: rawResumeData.workshops || [],
      
      // File metadata fields
      ...fileMetadata,
    };

    // *** FIX: ONLY include the ID field if it exists in the raw data ***
    if (rawResumeData.id) {
        dbPayload.id = rawResumeData.id;
        console.log(`Update detected for existing ID: ${dbPayload.id}`);
    } else {
        console.log('Insert detected (ID will be generated by database)');
    }
    // *** END FIX ***
    
    console.log('Database payload (for UPSERT):', JSON.stringify(dbPayload, null, 2));

    // *** MODIFICATION: Use UPSERT (Insert OR Update) ***
    const conflictColumn = 'email'; // Target the column with the unique constraint
    
    console.log(`Attempting UPSERT on table 'resumes' with conflict target: ${conflictColumn}`);
    const { data: upsertedData, error: dbError } = await supabase
      .from('resumes')
      .upsert([dbPayload], { 
            onConflict: conflictColumn,
            ignoreDuplicates: false 
        })
      .select();

    if (dbError) {
      console.error('Database error:', {
        error: dbError,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
        payload: dbPayload 
      });
      throw new Error(`Database operation failed: ${dbError.message}`);
    }

    if (!upsertedData || upsertedData.length === 0) {
      throw new Error('No data returned from database after operation');
    }

    console.log('Resume saved successfully:', JSON.stringify(upsertedData[0], null, 2));
    
    // Get API base URL from app.locals
    const apiBaseUrl = req.app.locals.API_BASE_URL || 'http://localhost:5000';
    
    // Add file URL to the response
    const responseData = {
      ...upsertedData[0],
      file_url: upsertedData[0].file_path 
        ? `${apiBaseUrl}/resumes/${upsertedData[0].id}/file` 
        : null
    };
    
    // Send Big 5 test invitation email if email is present
    if (upsertedData[0].email && upsertedData[0].name) {
      console.log('✉️ Attempting to send Big 5 test invitation...');
      console.log('Candidate Email:', upsertedData[0].email);
      console.log('Candidate Name:', upsertedData[0].name);
      console.log('Resume ID:', upsertedData[0].id);
      
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-big5-invite', {
          body: {
            candidateEmail: upsertedData[0].email,
            candidateName: upsertedData[0].name,
            resumeId: upsertedData[0].id,
          }
        });

        if (emailError) {
          console.error('❌ Failed to send Big 5 test invitation:', emailError);
          console.error('Error details:', JSON.stringify(emailError, null, 2));
          // Don't fail the resume creation if email fails
        } else {
          console.log('✅ Big 5 test invitation sent successfully!');
          console.log('Email response:', JSON.stringify(emailData, null, 2));
        }
      } catch (emailError) {
        console.error('❌ Exception while invoking send-big5-invite function:', emailError);
        console.error('Exception stack:', emailError.stack);
        // Don't fail the resume creation if email fails
      }
    } else {
      console.log('⚠️ Skipping Big 5 invitation - missing email or name');
      console.log('Email present:', !!upsertedData[0].email);
      console.log('Name present:', !!upsertedData[0].name);
    }
    
    res.status(201).json({
      success: true,
      message: 'Resume saved successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Unexpected error in createResume/updateResume:', {
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
      })
    });
  } finally {
    console.log('=== End of createResume/updateResume (UPSERT) ===');
  }
};

// Update a resume (Can be removed if you only use createResume, but left here for completeness)
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