import { supabase } from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// JWT secret key (should be in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

// Create a direct Supabase client for admin operations
const adminSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Login with email and password
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Validate email domain
    if (!email.endsWith('@mietjammu.in')) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only @mietjammu.in email addresses are allowed' 
      });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({ 
        success: false, 
        error: error.message || 'Invalid credentials' 
      });
    }

    // Create custom JWT token with user info and session
    const token = jwt.sign(
      { 
        id: data.user.id,
        email: data.user.email,
        role: 'admin',
        session: data.session.access_token
      }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRY }
    );

    // Return user data and token
    res.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          role: 'admin'
        },
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

/**
 * Verify the current user's session
 */
export const verifySession = async (req, res) => {
  try {
    const { user } = req;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Not authenticated' 
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: 'admin'
        }
      }
    });
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Session verification failed' 
    });
  }
};

/**
 * Logout the current user
 */
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    // Decode the JWT to get the Supabase session
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut({
      scope: 'local'
    });

    if (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Logout failed' 
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Logout failed' 
    });
  }
};

/**
 * Get the current user profile
 */
export const getProfile = async (req, res) => {
  try {
    const { user } = req;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Not authenticated' 
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get profile' 
    });
  }
};

/**
 * Register a new admin user (only accessible by existing admins)
 */
export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Validate email domain
    if (!email.endsWith('@mietjammu.in')) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only @mietjammu.in email addresses are allowed' 
      });
    }

    // Create user with admin role
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        role: 'admin'
      }
    });

    if (error) {
      console.error('Registration error:', error);
      return res.status(400).json({ 
        success: false, 
        error: error.message || 'Failed to create user' 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        id: data.user.id,
        email: data.user.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create user' 
    });
  }
};

/**
 * Create a test admin user (development only)
 */
export const createTestAdmin = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        success: false, 
        error: 'This endpoint is only available in development mode' 
      });
    }

    const email = 'admin@mietjammu.in';
    const password = 'Admin@123';

    // Check if user already exists
    const { data: existingUser } = await adminSupabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email === email);

    if (userExists) {
      return res.json({
        success: true,
        message: 'Test admin user already exists',
        credentials: { email, password }
      });
    }

    // Create test admin user
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: 'Test Admin',
        role: 'admin'
      }
    });

    if (error) {
      console.error('Test admin creation error:', error);
      return res.status(400).json({ 
        success: false, 
        error: error.message || 'Failed to create test admin' 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Test admin user created successfully',
      credentials: { email, password }
    });
  } catch (error) {
    console.error('Test admin creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create test admin' 
    });
  }
};
