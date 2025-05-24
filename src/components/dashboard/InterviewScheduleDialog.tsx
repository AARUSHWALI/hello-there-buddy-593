
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Clock } from "lucide-react";

interface ScheduledInterview {
  name: string;
  role: string;
  time: Date;
}

interface InterviewScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InterviewScheduleDialog({ isOpen, onClose }: InterviewScheduleDialogProps) {
  // Generate 5 random interviews for demo
  const interviews: ScheduledInterview[] = [
    { name: "Archit Bali", role: "Professor", time: new Date(2025, 3, 18, 9, 0) },
    { name: "Chetna Shree", role: "Assistant Professor", time: new Date(2025, 3, 18, 11, 30) },
    { name: "Ashank Gupta", role: "Associate Professor", time: new Date(2025, 3, 18, 13, 15) },
    { name: "Palak", role: "Research Associate", time: new Date(2025, 3, 18, 14, 45) },
    { name: "Manas Verma", role: "Dean", time: new Date(2025, 3, 18, 16, 0) },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white border border-gray-200 text-gray-800">
        <DialogHeader className="bg-purple-50 -mx-6 -mt-6 px-6 py-4 rounded-t-xl">
          <DialogTitle className="text-purple-700 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Interview Schedule
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {interviews.map((interview, index) => (
            <div 
              key={index} 
              className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-sm hover:border-purple-200 transition-all"
            >
              <div>
                <p className="font-medium text-gray-800">{interview.name}</p>
                <p className="text-sm text-gray-500">{interview.role}</p>
              </div>
              <div className="bg-purple-50 px-3 py-1 rounded-full text-sm font-medium text-purple-700 border border-purple-100 flex items-center">
                {format(interview.time, "hh:mm a")}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
