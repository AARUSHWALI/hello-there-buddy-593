import { ResumeData } from "@/types/resume";
import axios, { AxiosError } from 'axios';

// Configure axios defaults
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to handle errors consistently
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorMessage = error.response.data?.message || 'An error occurred';
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject(new Error('No response from server. Please check your connection.'));
    } else {
      // Something happened in setting up the request that triggered an Error
      return Promise.reject(error);
    }
  }
);

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export const saveResume = async (
  resumeData: ResumeData, 
  file?: File
): Promise<ApiResponse<{
  id: string;
  file_url?: string;
  file_path?: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
}>> => {
  const formData = new FormData();
  
  try {
    // Add resume data as JSON
    formData.append('data', JSON.stringify(resumeData));
    
    // If there's a file, add it to the form data
    if (file) {
      formData.append('resumeFile', file);
    }
    
    // Remove the Content-Type header to let the browser set it with the correct boundary
    const response = await api.post('/resume', formData, {
      headers: {
        'Content-Type': undefined, // Let the browser set the correct content type with boundary
      },
    });
    
    return { 
      success: true, 
      data: response.data 
    };
  } catch (error) {
    console.error('Error saving resume:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};

export const getResume = async (id: string): Promise<ApiResponse<ResumeData>> => {
  try {
    const response = await api.get(`/resume/${id}`);
    return { 
      success: true, 
      data: response.data 
    };
  } catch (error) {
    console.error('Error fetching resume:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};

interface SearchResult {
  id: string;
  name: string;
  email: string;
  best_fit_for: string;
  // Add other fields as needed
}

export const searchResumes = async (query: string): Promise<ApiResponse<SearchResult[]>> => {
  try {
    const response = await api.get('/resumes/search', {
      params: { query }
    });
    
    return { 
      success: true, 
      data: response.data 
    };
  } catch (error) {
    console.error('Error searching resumes:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};
