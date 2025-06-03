import { supabase } from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// JWT secret key (should be in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

/**
 * Middleware to verify JWT token from Authorization header
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if token is expired
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expired' 
      });
    }

    // Verify the Supabase session is still valid
    const { data: { user }, error } = await supabase.auth.getUser(decoded.session);

    if (error) {
      console.error('Token verification failed:', error);
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired session' 
      });
    }

    // Verify the user has an @mietjammu.in email address
    if (!user.email.endsWith('@mietjammu.in')) {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized email domain' 
      });
    }

    // Attach the user to the request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

/**
 * Middleware to ensure the user is an admin
 */
export const requireAdmin = (req, res, next) => {
  // The authenticateToken middleware should be called before this
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    });
  }
  
  // Check if the user's email is from the allowed domain
  if (!req.user.email.endsWith('@mietjammu.in')) {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required' 
    });
  }
  
  next();
};

export default {
  authenticateToken,
  requireAdmin
};
