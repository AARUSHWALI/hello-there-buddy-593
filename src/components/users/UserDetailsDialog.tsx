import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UserProfile } from "@/pages/Users";
import PersonalityPieChart from "./PersonalityPieChart";
import FitmentScoreGauge from "./FitmentScoreGauge";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

interface UserDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export default function UserDetailsDialog({ isOpen, onClose, user }: UserDetailsDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[70vw] w-[95vw] p-0 h-[90vh] overflow-hidden">
        <DialogHeader className="p-1 border-b sticky top-0 bg-white z-10">
          <DialogTitle className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Candidate Profile</span>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-5rem)] w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 p-8">
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="aspect-square w-full max-w-[250px] bg-gray-100 rounded-lg flex items-center justify-center">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-full h- object-cover rounded-lg" />
                  ) : (
                    <span className="text-gray-400">Profile Image</span>
                  )}
                </div>
                
                <div className="space-y-3 flex-1">
                  <h3 className="text-3xl font-semibold">{user.name}</h3>
                  <p className="text-gray-500 text-lg">{user.email}</p>
                  <div className="pt-2">
                    <div className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {user.jobRole}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5 bg-gray-50 p-1 rounded-lg">
                <div>
                  <h4 className="font-medium text-lg">Experience:</h4>
                  <p className="text-base">{user.experience}</p>
                </div>
                <div>
                  <h4 className="font-medium text-lg">Education:</h4>
                  <p className="text-base">{user.education}</p>
                </div>
                <div>
                  <h4 className="font-medium text-lg">About Me:</h4>
                  <p className="text-base text-gray-600">{user.about}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="bg-white rounded-lg border border-gray-200 p-2 shadow-sm">
                <h3 className="text-2xl font-semibold mb-1 text-center">AI Generated Fitment Score</h3>
                <div className="w-full max-w-[200px] mx-auto">
                  <FitmentScoreGauge score={user.score} />
                </div>
                
                <div className="mt-3">
                  <h4 className="font-medium text-center mb-1 text-lg">Score Breakdown</h4>
                  <div className="space-y-1 px-5">
                    <div className="flex justify-between">
                      <span className="font-medium">Longevity Score:</span>
                      <span>{(user.score * 0.3).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Achievements Score:</span>
                      <span>{(user.score * 0.4).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Psychometric Score:</span>
                      <span>{(user.score * 0.3).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {user.personalityScores && (
                <div className="bg-white rounded-lg border border-gray-200 p-2 shadow-sm space-y-1">
                  <h4 className="text-2xl font-semibold text-center">Personality Assessment</h4>
                  <div className="w-full h-[300px] max-w-[400px] mx-auto">
                    <PersonalityPieChart scores={user.personalityScores} />
                  </div>
                  
                  <div className="mt-6 space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between text-sm">
                      <span>Extroversion</span>
                      <span>{user.personalityScores.extraversion}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Agreeableness</span>
                      <span>{user.personalityScores.agreeableness}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Openness</span>
                      <span>{user.personalityScores.openness}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Neuroticism</span>
                      <span>{user.personalityScores.neuroticism}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Conscientiousness</span>
                      <span>{user.personalityScores.conscientiousness}%</span>
                    </div>
                    
                    <Button 
                      onClick={() => {
                        if (user.file_url) {
                          // Fix the URL to prevent duplicate 'api' in the path
                          let resumeUrl;
                          if (user.file_url.startsWith('http')) {
                            // If it's already a full URL, check for duplicate 'api'
                            resumeUrl = user.file_url.replace('/api/api/', '/api/');
                          } else {
                            // For relative URLs, ensure proper formatting
                            resumeUrl = `${window.location.origin}${user.file_url.startsWith('/') ? '' : '/'}${user.file_url}`;
                          }
                          window.open(resumeUrl, '_blank', 'noopener,noreferrer');
                        } else {
                          toast({
                            title: "Resume not available",
                            description: "This user doesn't have a resume uploaded.",
                            variant: "destructive"
                          });
                        }
                      }} 
                      className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white"
                      disabled={!user.file_url}
                    >
                      {user.file_url ? "View Resume" : "No Resume Available"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}