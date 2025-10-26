-- Create users/candidates table (maps to resumes)
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  summary TEXT,
  education JSONB,
  skills TEXT[],
  longevity_years INTEGER,
  best_fit_for TEXT,
  fitment_score DECIMAL(5,2),
  candidate_type BOOLEAN,
  file_url TEXT,
  extraversion INTEGER DEFAULT 0,
  agreeableness INTEGER DEFAULT 0,
  openness INTEGER DEFAULT 0,
  neuroticism INTEGER DEFAULT 0,
  conscientiousness INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read candidates (public-facing recruitment app)
CREATE POLICY "Candidates are viewable by everyone" 
ON public.candidates 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to insert candidates (for resume uploads)
CREATE POLICY "Anyone can create candidates" 
ON public.candidates 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow anyone to update candidates
CREATE POLICY "Anyone can update candidates" 
ON public.candidates 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on email for faster lookups
CREATE INDEX idx_candidates_email ON public.candidates(email);

-- Create index on fitment_score for filtering
CREATE INDEX idx_candidates_fitment_score ON public.candidates(fitment_score DESC);