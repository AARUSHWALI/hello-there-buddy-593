import { useState } from "react";
import { Upload, FileText, File as FileIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ResumeData } from "@/types/resume";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ResumeUploadProps {
  onResumeUploaded: (data: ResumeData, file: File) => void;
  onParsingStateChange: (loading: boolean) => void;
}

export default function ResumeUpload({ onResumeUploaded, onParsingStateChange }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  // Updated Gemini API key
  const GEMINI_API_KEY = "AIzaSyCBOk69oj5NqbIFE3AE-ecDwbmtExMl-FE";

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (uploadedFile: File) => {
    setError(null);
    
    // Check file type
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(uploadedFile.type)) {
      setError("Please upload a valid PDF or Word document");
      return;
    }
    
    // Check file size (10MB max)
    if (uploadedFile.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit");
      return;
    }
    
    setFile(uploadedFile);
  };

  const getFileIcon = () => {
    if (!file) return <Upload size={40} />;
    
    switch(file.type) {
      case "application/pdf":
        return <FileText size={40} className="text-red-500" />;
      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return <FileIcon size={40} className="text-blue-500" />;
      default:
        return <FileIcon size={40} />;
    }
  };

  // Function to extract email from text or hyperlinks
  const extractEmailFromText = (text: string): string | null => {
    // Check for mailto: links first
    const mailtoRegex = /mailto:([^"'?]+)/i;
    const mailtoMatch = text.match(mailtoRegex);
    
    if (mailtoMatch && mailtoMatch[1]) {
      return mailtoMatch[1];
    }
    
    // Regular expression for matching email addresses
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const matches = text.match(emailRegex);
    
    if (matches && matches.length > 0) {
      return matches[0];
    }
    
    return null;
  };

  const parseResume = async () => {
    if (!file) return;
    
    try {
      setUploading(true);
      onParsingStateChange(true);
      setError(null);
      
      // Start progress indication
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Convert file to base64 for sending to Gemini API
      const fileBase64 = await readFileAsBase64(file);
      
      // Use Gemini 1.5 Pro for better document processing
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;
      
      // Craft a prompt that will work well for resume parsing
      const prompt = `
        Extract structured information from the following resume and return it in JSON format.
        Use double quotes for all keys and string values.
        
        Extract all of the following fields:
        
        - personalInfo: object with name, email, phone, address, summary
        - education: array of objects with institution, degree, field, startDate, endDate, gpa
        - experience: array of objects with company, position, startDate, endDate, description, location
        - skills: array of skills as strings
        - UG_InstituteName: string (undergraduate institution name)
        - PG_InstituteName: string (postgraduate institution name)
        - PhD_Institute: number (0 for no, 1 for yes)
        - Longevity_Years: number (working years count)
        - No_of_Jobs: number
        - Experience_Average: number (Longevity_Years / No_of_Jobs)
        - Skills_No: number
        - Achievements_No: number
        - Achievements: array of strings
        - Trainings_No: number
        - Trainings: array of strings
        - Workshops_No: number
        - Workshops: array of strings
        - Research_Papers: array of strings
        - Patents: array of strings
        - Books: array of strings
        - State_JK: number (0 for no, 1 for yes - for J&K resident)
        - Projects_No: number
        - Projects: array of strings
        - Best_Fit_For: string (suggest a Computer Science job role suitable for the candidate)
        
        For locations, check if it mentions Jammu, Kashmir, or J&K and set State_JK to 1 if it does.
        
        Return only the JSON with no additional explanation or markdown formatting.
      `;
      
      try {
        console.log("Making API request to:", geminiEndpoint);
        
        // Make the actual API call to Gemini - FIXED: Removed the ?key= from the URL since it's now in the endpoint
        const response = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType: file.type, data: fileBase64 } }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096,
              topP: 0.95,
              topK: 40
            }
          })
        });

        const data = await response.json();
        
        // Check for API quota errors
        if (data.error && data.error.message && data.error.message.includes("quota")) {
          clearInterval(interval);
          setError("API quota exceeded. Please try again later or contact support for assistance.");
          setUploading(false);
          onParsingStateChange(false);
          console.error("API quota error:", data.error);
          return;
        }
        
        if (data.error) {
          console.error("API error details:", data.error);
          throw new Error(data.error.message || "Failed to parse resume");
        }
        
        // Extract JSON from the response
        const parsedContent = data.candidates[0].content.parts[0].text;
        
        // Try multiple regex patterns to extract the JSON
        const jsonMatches = [
          // Match JSON enclosed in code blocks
          parsedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/),
          // Match JSON enclosed in brackets
          parsedContent.match(/(\{[\s\S]*\})/),
          // Fallback to the whole response
          { 1: parsedContent }
        ];
        
        // Find the first successful match
        let jsonText = null;
        for (const match of jsonMatches) {
          if (match && match[1]) {
            jsonText = match[1].trim();
            break;
          }
        }
        
        if (!jsonText) {
          throw new Error("Could not extract JSON from the response");
        }
        
        // Parse the JSON
        let parsedResumeData;
        try {
          parsedResumeData = JSON.parse(jsonText);
          console.log("Parsed resume data:", parsedResumeData);
        
          // Map received data to match ResumeData interface
          const mappedData: ResumeData = {
            personalInfo: parsedResumeData.personalInfo || {
              name: "",
              email: "",
              phone: "",
              address: "",
              summary: ""
            },
            education: parsedResumeData.education || [],
            experience: parsedResumeData.experience || [],
            skills: parsedResumeData.skills || [],
            ugInstitute: parsedResumeData.UG_InstituteName || "",
            pgInstitute: parsedResumeData.PG_InstituteName || "",
            phdInstitute: parsedResumeData.PhD_Institute || 0,
            longevityYears: parsedResumeData.Longevity_Years || 0,
            numberOfJobs: parsedResumeData.No_of_Jobs || 0,
            averageExperience: parsedResumeData.Experience_Average || 0,
            skillsCount: parsedResumeData.Skills_No || 0,
            achievementsCount: parsedResumeData.Achievements_No || 0,
            achievements: parsedResumeData.Achievements || [],
            trainingsCount: parsedResumeData.Trainings_No || 0,
            trainings: parsedResumeData.Trainings || [],
            workshopsCount: parsedResumeData.Workshops_No || 0,
            workshops: parsedResumeData.Workshops || [],
            researchPapers: parsedResumeData.Research_Papers || [],
            patents: parsedResumeData.Patents || [],
            books: parsedResumeData.Books || [],
            isJK: parsedResumeData.State_JK || 0,
            projectsCount: parsedResumeData.Projects_No || 0,
            projects: parsedResumeData.Projects || [],
            bestFitFor: parsedResumeData.Best_Fit_For || ""
          };
          
          // Ensure we have an email - try to extract from raw content if not found
          if (!mappedData.personalInfo.email || mappedData.personalInfo.email.trim() === "") {
            const extractedEmail = extractEmailFromText(parsedContent);
            if (extractedEmail) {
              mappedData.personalInfo.email = extractedEmail;
            }
          }

          // Store resume data in Supabase
          const { data: resumeData, error: insertError } = await supabase
            .from('candidate_resume')
            .insert({
              ug_institute_name: mappedData.ugInstitute,
              pg_institute_name: mappedData.pgInstitute,
              phd_institute: mappedData.phdInstitute,
              best_fit_for: mappedData.bestFitFor,
              skills: mappedData.skills.join(', '),
              skills_no: mappedData.skillsCount,
              achievements: mappedData.achievements.join(', '),
              achievements_no: mappedData.achievementsCount,
              projects: mappedData.projects.join(', '),
              projects_no: mappedData.projectsCount,
              longevity_years: mappedData.longevityYears,
              number_of_jobs: mappedData.numberOfJobs,
              experience_average: mappedData.averageExperience,
              trainings: mappedData.trainingsCount,
              workshops: mappedData.workshopsCount,
              state_jk: mappedData.isJK === 1,
              total_papers: mappedData.researchPapers?.length || 0,
              total_patents: mappedData.patents?.length || 0,
              books: mappedData.books?.length || 0,
              email: mappedData.personalInfo.email,
              education: JSON.stringify(mappedData.education),
              experience: JSON.stringify(mappedData.experience),
              personal_info: JSON.stringify(mappedData.personalInfo)
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error inserting data:", insertError);
            throw insertError;
          }

          // Try to send personality test invitation using the extracted email
          if (mappedData.personalInfo.email) {
            try {
              const { error: inviteError } = await supabase.functions.invoke('send-personality-test-invite', {
                body: {
                  resumeId: resumeData.id,
                  email: mappedData.personalInfo.email,
                  name: mappedData.personalInfo.name,
                  personalityTestUrl: `${window.location.origin}/personality-test`
                }
              });

              if (inviteError) {
                console.error("Error sending invitation:", inviteError);
                // Don't throw here, we want to continue even if email fails
              }
            } catch (emailError) {
              console.error("Failed to send email:", emailError);
              // Continue processing even if email sending fails
            }
          }

          // Clear progress interval and set to 100%
          clearInterval(interval);
          setProgress(100);
          
          // Notify user and return data
          setTimeout(() => {
            toast({
              title: "Resume Processed Successfully",
              description: "The resume has been parsed and stored successfully.",
            });
            onResumeUploaded(mappedData, file);
            setUploading(false);
            onParsingStateChange(false);
          }, 500);
        } catch (jsonError) {
          console.error("Error parsing JSON:", jsonError);
          console.error("Raw JSON text:", jsonText);
          throw new Error("Invalid JSON response from API");
        }
      } catch (error: any) {
        clearInterval(interval);
        
        // Provide more specific error messages based on error type
        if (error.message && error.message.includes("quota")) {
          setError("API quota exceeded. Please try again later or contact support for assistance.");
        } else {
          console.error("Detailed error:", error);
          setError("Failed to process resume. Please try again or use the Demo Data option.");
        }
        
        setUploading(false);
        onParsingStateChange(false);
        console.error("Error parsing resume:", error);
      }
    } catch (error: any) {
      // Handle top-level errors
      let errorMessage = "Failed to process resume. Please try again.";
      
      if (error.message && error.message.includes("quota")) {
        errorMessage = "API quota exceeded. Please try again later or contact support for assistance.";
      } else if (error.message && error.message.includes("network")) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      }
      
      console.error("Top-level error details:", error);
      setError(errorMessage);
      setUploading(false);
      onParsingStateChange(false);
      console.error("Error parsing resume:", error);
    }
  };

  // Function to simulate parsing without using the API
  const useDemoData = () => {
    if (!file) return;
    
    setUploading(true);
    onParsingStateChange(true);
    setError(null);
    
    // Start progress indication
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);
    
    // Use timeout to simulate API call
    setTimeout(() => {
      // Sample data for demo purposes
      const demoData: ResumeData = {
        personalInfo: {
          name: "John Smith",
          email: "john.smith@example.com",
          phone: "+1 (555) 123-4567",
          address: "123 Main St, New York, NY 10001",
          summary: "Experienced software developer with 5+ years in web development."
        },
        education: [
          {
            institution: "Stanford University",
            degree: "Bachelor of Science",
            field: "Computer Science",
            startDate: "2015",
            endDate: "2019",
            gpa: "3.8"
          }
        ],
        experience: [
          {
            company: "Tech Solutions Inc.",
            position: "Senior Developer",
            startDate: "2019",
            endDate: "Present",
            description: "Led development of web applications using React and Node.js.",
            location: "San Francisco, CA"
          },
          {
            company: "Digital Innovations",
            position: "Junior Developer",
            startDate: "2017",
            endDate: "2019",
            description: "Developed and maintained client websites.",
            location: "San Jose, CA"
          }
        ],
        skills: ["JavaScript", "React", "Node.js", "TypeScript", "HTML", "CSS", "Git"],
        ugInstitute: "Stanford University",
        pgInstitute: "",
        phdInstitute: 0,
        longevityYears: 5,
        numberOfJobs: 2,
        averageExperience: 2.5,
        skillsCount: 7,
        achievementsCount: 2,
        achievements: ["Employee of the Year 2021", "Led team to successful project completion"],
        trainingsCount: 1,
        trainings: ["Advanced React Patterns"],
        workshopsCount: 2,
        workshops: ["Web Accessibility", "Performance Optimization"],
        researchPapers: [],
        patents: [],
        books: [],
        isJK: 0,
        projectsCount: 3,
        projects: ["E-commerce Platform", "Healthcare Portal", "Mobile Banking App"],
        bestFitFor: "Full Stack Developer"
      };
      
      clearInterval(interval);
      setProgress(100);
      
      // Notify user and return data
      setTimeout(() => {
        toast({
          title: "Demo Data Loaded",
          description: "Sample resume data has been loaded for demonstration.",
        });
        onResumeUploaded(demoData, file);
        setUploading(false);
        onParsingStateChange(false);
      }, 500);
    }, 2000);
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Extract base64 data without the prefix
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        className={`border-2 border-dashed rounded-lg p-10 w-full text-center cursor-pointer transition-colors
          ${dragging ? 'bg-purple-50 border-purple-400' : 'bg-gray-50 border-gray-300'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center bg-purple-50 rounded-full">
            {getFileIcon()}
          </div>
          
          <div>
            {!file && (
              <>
                <p className="text-lg font-medium mb-2">Drop your resume here or click to browse</p>
                <p className="text-sm text-gray-500">Supports PDF, DOC, DOCX (Max 10MB)</p>
              </>
            )}
            
            {file && (
              <div className="mt-2">
                <p className="text-lg font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-4 w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {file && !uploading && (
        <div className="mt-6 flex gap-4 flex-wrap justify-center">
          <Button 
            variant="outline" 
            onClick={() => { setFile(null); setError(null); }}
          >
            Choose Different File
          </Button>
          <Button 
            onClick={parseResume}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Parse Resume
          </Button>
          {/* Added a demo button option for when the API quota is exceeded */}
          <Button
            variant="secondary"
            onClick={useDemoData}
            className="bg-purple-100 hover:bg-purple-200 text-purple-800"
          >
            Use Demo Data
          </Button>
        </div>
      )}
      
      {uploading && (
        <div className="mt-6 w-full">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Parsing resume...</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );
}
