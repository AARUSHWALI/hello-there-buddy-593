import express from 'express';
import { login, logout, verifySession, getProfile, register, createTestAdmin } from '../controllers/authController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register); // Register a new admin user
router.post('/create-test-admin', createTestAdmin); // Dev only

// Protected routes
router.get('/verify', authenticateToken, verifySession);
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, requireAdmin, getProfile);

export default router;
