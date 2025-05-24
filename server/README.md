# Resume Parser API

A Node.js API for parsing and storing resume information in a Supabase database.

## Features

- Store and retrieve resume data
- Structured data storage for personal info, education, experience, skills, achievements, and projects
- Metadata tracking for analytics and matching
- File upload support (PDF, DOC, DOCX)
- RESTful API endpoints
- Automatic database schema initialization

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Supabase project (get one at [supabase.com](https://supabase.com/))

## Getting Started

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your Supabase credentials:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase anon/public key
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key (required for database initialization)

### Database Initialization

The server will automatically initialize the database schema when it starts. This includes:

1. Creating the `resumes` table with all required columns
2. Setting up indexes for better query performance
3. Creating a trigger for the `updated_at` timestamp

If you need to manually initialize the database, you can run:

```bash
node db-init.js
```

For direct database access (optional), you can set the `DATABASE_URL` environment variable:
```
DATABASE_URL=postgresql://postgres:your_password@db.your-supabase-project.supabase.co:5432/postgres
```

### Running the Server

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

2. Start the server:
   ```bash
   npm start
   # or
   yarn start
   ```

3. The server will be available at `http://localhost:5000`

### Development

For development with auto-reload:

```bash
npm run dev
# or
yarn dev
```

## API Endpoints

### Store Resume Data (with optional file upload)

**POST** `/api/resume`

You can either:
1. Send a JSON body with resume data
2. Upload a file with form-data (field name: `resumeFile`) along with the resume data

#### Example with file upload (using form-data):
```bash
curl -X POST http://localhost:5000/api/resume \
  -H "Content-Type: multipart/form-data" \
  -F "resumeFile=@/path/to/resume.pdf" \
  -F 'data={"personalInfo":{"name":"John Doe"},...}'
```

#### Example with JSON only:
```bash
curl -X POST http://localhost:5000/api/resume \
  -H "Content-Type: application/json" \
  -d @parse.json
```

Supported file types: PDF, DOC, DOCX (max 5MB)

### Get Resume by ID

**GET** `/api/resume/:id`

Retrieve a stored resume by its ID, including file information if available.

### Get Resume File

**GET** `/api/resume/file/:id`

Redirects to the direct download URL of the resume file (if available).

### Search Resumes

**GET** `/api/resumes/search?query=search+term`

Search resumes by name, email, or best fit position.

## Project Structure

```
server/
├── .env.example           # Example environment variables
├── .gitignore
├── package.json
├── README.md
├── db-init.js             # Database initialization script
├── database.sql           # Database schema
└── index.js               # Main application file
```

## Deployment

1. Set the environment variables in your production environment
2. Install dependencies with `--production` flag:
   ```bash
   npm install --production
   ```
3. Start the server:
   ```bash
   npm start
   ```

For production, consider using a process manager like PM2:

```bash
npm install -g pm2
pm2 start index.js --name "resume-parser"
```

## Troubleshooting

### Database Initialization Issues

1. **Missing Service Role Key**: Ensure you've set the `SUPABASE_SERVICE_KEY` in your `.env` file.
2. **Connection Issues**: Verify your Supabase project URL and keys are correct.
3. **Schema Already Exists**: If tables already exist, the initialization will skip creating them.

### File Upload Issues

1. **File Size Limit**: The default limit is 5MB. You can adjust this in `index.js`.
2. **File Type**: Only PDF, DOC, and DOCX files are allowed.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Supabase](https://supabase.com/) for the awesome backend-as-a-service
- [Express](https://expressjs.com/) for the web framework
- [Multer](https://github.com/expressjs/multer) for file uploads

## Database Schema

The database consists of the following tables:

- `personal_info`: Stores basic personal information
- `education`: Stores educational background
- `experience`: Stores work experience
- `skills`: Stores skills
- `achievements`: Stores achievements
- `projects`: Stores projects
- `resume_metadata`: Stores additional metadata and analytics

## Error Handling

The API returns appropriate HTTP status codes and JSON error messages in case of errors.

## License

MIT
