const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Auth = require('../models/Auth');

const userOne = {
  fname: 'Test',
  lname: 'User',
  email: 'test@example.com',
  password: 'Test@1234',
  phone: '1234567890',
};

beforeEach(async () => {
  await Auth.deleteMany();
  await new Auth(userOne).save();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fname: 'John',
          lname: 'Doe',
          email: 'john@example.com',
          password: 'Password@123',
          phone: '1234567891',
        })
        .expect(201);

      // Assert that the response contains user data without password
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user.email).toBe('john@example.com');

      // Assert that the user is actually in the database
      const user = await Auth.findOne({ email: 'john@example.com' });
      expect(user).not.toBeNull();
      expect(user.fname).toBe('John');
    });

    test('should not register user with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fname: 'John',
          lname: 'Doe',
          email: 'invalid-email',
          password: 'Password@123',
          phone: '1234567891',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors[0].message).toContain('valid email');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login existing user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userOne.email,
          password: userOne.password,
        })
        .expect(200);

      // Check if token is sent in the response
      expect(response.body.token).toBeDefined();
      
      // Check if httpOnly cookie is set
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token=');
      expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    });

    test('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userOne.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Incorrect email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should get user profile', async () => {
      // First login to get the token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userOne.email,
          password: userOne.password,
        });

      const token = loginResponse.body.token;

      // Use the token to access protected route
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `token=${token}`)
        .expect(200);

      expect(response.body.data.user.email).toBe(userOne.email);
    });

    test('should not get profile without token', async () => {
      await request(app).get('/api/auth/me').expect(401);
    });
  });
});
