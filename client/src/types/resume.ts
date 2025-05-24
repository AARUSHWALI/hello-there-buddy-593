export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    summary?: string;
  };
  education: Education[];
  experience: Experience[];
  skills: string[];
  ugInstitute?: string;
  pgInstitute?: string;
  phdInstitute: number; // 0 for no, 1 for yes
  longevityYears: number; // working years count
  numberOfJobs: number;
  averageExperience: number; // longevity/number of jobs
  skillsCount: number;
  achievementsCount: number;
  achievements: string[];
  trainingsCount: number;
  trainings: string[];
  workshopsCount: number;
  workshops: string[];
  researchPapers: string[];
  researchPapersCount: number;
  patents: string[];
  patentsCount: number;
  books: string[];
  booksCount: number;
  isJK: number; // 0 for no, 1 for yes (J&K)
  projectsCount: number;
  projects: string[];
  bestFitFor?: string; // Making this optional and adding it to the interface
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  location?: string;
}
