
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarIcon, PlusCircle, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import InterviewScheduleDialog from "@/components/dashboard/InterviewScheduleDialog";

export default function Interview() {
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    user: '',
    date: new Date()
  });

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.description || !newEvent.user) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields to create an event",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Event Created",
      description: `Your event "${newEvent.title}" has been scheduled for ${format(selectedDate, 'PPP')}`
    });
    
    setShowEventDialog(false);
    setNewEvent({ title: '', description: '', user: '', date: new Date() });
  };

  return (
    <div className="page-container bg-gradient-to-br from-purple-50/80 to-white p-6">
      <h1 className="text-2xl font-bold text-purple-800 mb-6">Interview Calendar</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-purple-100">
            <div className="p-4 border-b border-purple-100 bg-purple-50 flex justify-between items-center">
              <h2 className="text-lg font-medium text-purple-700">Select Date</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  onClick={() => setShowScheduleDialog(true)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Today's Schedule
                </Button>
                <Button 
                  onClick={() => setShowEventDialog(true)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Event
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border border-purple-100 w-full"
                classNames={{
                  day_selected: "bg-purple-600 text-white hover:bg-purple-600",
                  day_today: "bg-purple-100 text-purple-900",
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Right column - Event details */}
        <div>
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-purple-100 h-full">
            <div className="p-4 border-b border-purple-100 bg-purple-50">
              <h2 className="text-lg font-medium text-purple-700">Selected Date</h2>
            </div>
            <div className="p-6">
              <div className="text-center mb-4">
                <p className="text-xl font-semibold text-purple-800">{format(selectedDate, 'PPPP')}</p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <h3 className="font-medium">Scheduled Interviews</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Click on "New Event" to schedule an interview for this date.
                  </p>
                </div>
                
                <Button 
                  onClick={() => setShowEventDialog(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule Interview
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Event creation dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="bg-white border border-purple-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-purple-800">Schedule Interview for {format(selectedDate, 'PPP')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Input
                placeholder="Interview Title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="border-purple-200 focus-visible:ring-purple-500"
              />
            </div>
            
            <div>
              <Textarea
                placeholder="Interview Details"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="min-h-[100px] border-purple-200 focus-visible:ring-purple-500"
              />
            </div>
            
            <div>
              <Select
                value={newEvent.user}
                onValueChange={(value) => setNewEvent({ ...newEvent, user: value })}
              >
                <SelectTrigger className="border-purple-200 focus:ring-purple-500">
                  <SelectValue placeholder="Select Candidate" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-purple-100">
                  <SelectItem value="ayushthakur1412@gmail.com">
                    Ayush Thakur
                  </SelectItem>
                  <SelectItem value="archit.bali@example.com">
                    Archit Bali
                  </SelectItem>
                  <SelectItem value="chetna.shree@example.com">
                    Chetna Shree
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowEventDialog(false)}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateEvent}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Create Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Today's schedule dialog */}
      <InterviewScheduleDialog 
        isOpen={showScheduleDialog} 
        onClose={() => setShowScheduleDialog(false)} 
      />
    </div>
  );
}
