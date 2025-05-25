import { supabase } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Upload file to Supabase Storage
const uploadFileToStorage = async (file) => {
  try {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = `resumes/${fileName}`;

    // Ensure the bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) throw bucketsError;

    const bucketExists = buckets.some(bucket => bucket.name === 'resume');
    if (!bucketExists) {
      const { error: createBucketError } = await supabase.storage
        .createBucket('resume', { public: false });
      if (createBucketError) throw createBucketError;
    }

    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resume')
      .upload(filePath, fs.createReadStream(file.path), {
        cacheControl: '3600',
        upsert: false,
        contentType: file.mimetype
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resume')
      .getPublicUrl(filePath);

    // Clean up the temporary file
    fs.unlinkSync(file.path);

    return {
      original_filename: file.originalname,
      file_path: filePath,
      file_url: publicUrl,
      file_size: file.size,
      mime_type: file.mimetype
    };
  } catch (error) {
    console.error('Error in file upload:', error);
    throw error;
  }
};

// Get all resumes with pagination
export const getResumes = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;

    const { data, error, count } = await supabase
      .from('resumes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch resumes',
      message: error.message 
    });
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
    if (!data) return res.status(404).json({ error: 'Resume not found' });

    res.json(data);
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
};

// Create a new resume
export const createResume = async (req, res) => {
  try {
    const resumeData = req.body;
    
    // Handle file upload if present
    if (req.file) {
      const fileData = await uploadFileToStorage(req.file);
      resumeData.file_data = fileData;
    }

    const { data, error } = await supabase
      .from('resumes')
      .insert([resumeData])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating resume:', error);
    res.status(500).json({ error: 'Failed to create resume' });
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
