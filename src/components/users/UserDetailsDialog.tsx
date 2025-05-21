
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import type { UserProfile } from "@/hooks/useUsers";
import PersonalityPieChart from "./PersonalityPieChart";

interface UserDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export default function UserDetailsDialog({ isOpen, onClose, user }: UserDetailsDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="aspect-square w-full max-w-[300px] mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="text-gray-400">Profile Image</span>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Job Role:</h4>
                <p>{user.jobRole}</p>
              </div>
              <div>
                <h4 className="font-medium">Experience:</h4>
                <p>{user.experience}</p>
              </div>
              <div>
                <h4 className="font-medium">Education:</h4>
                <p>{user.education}</p>
              </div>
              <div>
                <h4 className="font-medium">About Me:</h4>
                <p className="text-gray-600">{user.about}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">AI Generated Fitment Score</h3>
              <div className="text-center p-4 border rounded-lg">
                <Progress value={user.score} className="h-2 mb-2" />
                <div className="text-3xl font-bold text-blue-600">
                  {user.score.toFixed(2)}%
                </div>
              </div>
            </div>

            {user.personalityScores && (
              <div className="space-y-4">
                <h4 className="font-medium">Personality Assessment</h4>
                <PersonalityPieChart scores={user.personalityScores} />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
