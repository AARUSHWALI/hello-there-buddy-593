# People.AI Backend

A secure, production-ready Node.js backend with Express, MongoDB, and JWT authentication.

## Features

- 🔐 JWT Authentication with HTTP-only cookies
- 🛡️ Security best practices (helmet, rate limiting, data sanitization)
- 🚀 Performance optimization (compression, request limiting)
- ✅ Input validation and error handling
- 🔄 MongoDB with Mongoose ODM
- 🧪 Testing with Jest and Supertest
- 🔄 Environment-based configuration

## Prerequisites

- Node.js >= 14.0.0
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/people-ai.git
   cd people-ai/server
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=90d
   JWT_COOKIE_EXPIRE=90
   ```

## Running the Server

### Development

```bash
npm run dev
# or
yarn dev
```

### Production

```bash
npm start
# or
yarn start
```

## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - Logout user
- `PATCH /api/auth/update-password` - Update password

### Users

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID

### Jobs

- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create a new job

### Roles

- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create a new role

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Linting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment | development |
| PORT | Server port | 5000 |
| MONGO_URI | MongoDB connection string | - |
| JWT_SECRET | JWT secret key | - |
| JWT_EXPIRE | JWT expiration time | 90d |
| JWT_COOKIE_EXPIRE | Cookie expiration in days | 90 |
| RATE_LIMIT_WINDOW_MS | Rate limit window in ms | 15 * 60 * 1000 |
| RATE_LIMIT_MAX | Max requests per window | 100 |
| CLIENT_URL | Frontend URL | http://localhost:3000 |

## Security

- Uses Helmet for setting secure HTTP headers
- Rate limiting to prevent brute-force attacks
- Data sanitization against NoSQL injection and XSS
- Secure JWT storage in HTTP-only cookies
- Password hashing with bcrypt
- Input validation using express-validator

## License

MIT
