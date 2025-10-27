-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_filename VARCHAR(255),
  file_path TEXT,
  file_url TEXT,
  file_size BIGINT,
  mime_type VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  summary TEXT,
  education JSONB DEFAULT '[]',
  experience JSONB DEFAULT '[]',
  skills JSONB DEFAULT '[]',
  achievements JSONB DEFAULT '[]',
  projects JSONB DEFAULT '[]',
  research_papers JSONB DEFAULT '[]',
  patents JSONB DEFAULT '[]',
  books JSONB DEFAULT '[]',
  trainings JSONB DEFAULT '[]',
  workshops JSONB DEFAULT '[]',
  ug_institute VARCHAR(255),
  pg_institute VARCHAR(255),
  phd_institute VARCHAR(100),
  longevity_years INTEGER,
  number_of_jobs INTEGER,
  average_experience NUMERIC(3,1),
  skills_count INTEGER,
  achievements_count INTEGER,
  trainings_count INTEGER,
  workshops_count INTEGER,
  projects_count INTEGER,
  research_papers_count INTEGER,
  patents_count INTEGER,
  books_count INTEGER,
  is_jk BOOLEAN DEFAULT FALSE,
  best_fit_for VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_email ON resumes(email);
CREATE INDEX IF NOT EXISTS idx_resumes_best_fit ON resumes(best_fit_for);
CREATE INDEX IF NOT EXISTS idx_resumes_file_path ON resumes(file_path);

CREATE TRIGGER update_resumes_updated_at
BEFORE UPDATE ON resumes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  candidate_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  candidate_name VARCHAR(255) NOT NULL,
  candidate_email VARCHAR(255) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_start_time TIMESTAMP WITH TIME ZONE,
  scheduled_end_time TIMESTAMP WITH TIME ZONE,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  interviewer_id UUID,
  interviewer_name VARCHAR(255),
  interviewer_email VARCHAR(255),
  meeting_link TEXT,
  meeting_platform VARCHAR(100),
  interview_type VARCHAR(100),
  job_title VARCHAR(255),
  job_description TEXT,
  interviewer_notes TEXT,
  candidate_feedback TEXT,
  technical_assessment TEXT,
  overall_rating INTEGER CHECK (overall_rating IS NULL OR (overall_rating >= 1 AND overall_rating <= 5)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_interviewer_id ON interviews(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_time ON interviews(scheduled_start_time, scheduled_end_time);

CREATE TRIGGER update_interviews_updated_at
BEFORE UPDATE ON interviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create fitment_criteria table
CREATE TABLE IF NOT EXISTS fitment_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  best_fit INTEGER NOT NULL,
  average_fit INTEGER NOT NULL,
  not_fit INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  CONSTRAINT valid_fitment_thresholds CHECK (
    best_fit > average_fit AND 
    average_fit > not_fit AND
    not_fit >= 0
  )
);

CREATE TRIGGER update_fitment_criteria_updated_at
BEFORE UPDATE ON fitment_criteria
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

INSERT INTO fitment_criteria (best_fit, average_fit, not_fit, created_by)
SELECT 80, 50, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM fitment_criteria);