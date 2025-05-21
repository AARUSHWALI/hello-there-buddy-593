
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CandidateDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    name: string;
    email: string;
    fitmentScore: number;
    phone: string;
    education: string;
    experience: string;
    skills: string[];
    projects: string[];
    expectedRole: string;
    location: string;
    longevityScore: number;
  } | null;
}

export default function CandidateDetailsDialog({ isOpen, onClose, candidate }: CandidateDetailsProps) {
  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Candidate Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.email}`} />
              <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{candidate.name}</h3>
              <p className="text-sm text-gray-500">{candidate.email}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Fitment Score</span>
              <span className={`text-lg font-semibold ${
                candidate.fitmentScore >= 60 ? "text-green-600" :
                candidate.fitmentScore >= 50 ? "text-yellow-600" :
                "text-red-600"
              }`}>
                {candidate.fitmentScore.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
