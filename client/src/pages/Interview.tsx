
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CalendarIcon, PlusCircle, Clock, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { format, isToday, isSameDay, parseISO } from "date-fns";
import axios from "axios";
import InterviewScheduleDialog from "@/components/dashboard/InterviewScheduleDialog";

interface Interview {
  id: string;
  title: string;
  description: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  jobRole?: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

export default function Interview() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    candidateId: '',
    date: new Date()
  });

  // Fetch interviews and candidates
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching data from:', `${API_BASE_URL}/resumes`);
        
        // Fetch candidates first
        const candidatesRes = await axios.get(`${API_BASE_URL}/resumes`);
        console.log('Candidates API Response:', candidatesRes.data);

        if (candidatesRes.data?.data) {
          const candidatesData = Array.isArray(candidatesRes.data.data) 
            ? candidatesRes.data.data 
            : [candidatesRes.data.data];
            
          console.log('Processed candidates data:', candidatesData);
          
          const formattedCandidates = candidatesData.map((c: any) => ({
            id: c.id || c.email, // Use email as fallback ID if id is not present
            name: c.name || 'Unknown Candidate',
            email: c.email || '',
            jobRole: c.best_fit_for || c.job_title || 'Not specified'
          }));
          
          console.log('Formatted candidates:', formattedCandidates);
          setCandidates(formattedCandidates);
        }

        // Then fetch interviews
        try {
          const interviewsRes = await axios.get(`${API_BASE_URL}/interviews`);
          console.log('Interviews API Response:', interviewsRes.data);
          
          if (interviewsRes.data?.data) {
            setInterviews(Array.isArray(interviewsRes.data.data) 
              ? interviewsRes.data.data 
              : [interviewsRes.data.data]);
          }
        } catch (interviewError) {
          console.error('Error fetching interviews:', interviewError);
          toast({
            title: "Warning",
            description: "Interviews could not be loaded, but you can still schedule new ones.",
            variant: "default"
          });
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        console.error('Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
          },
        });
        
        toast({
          title: "Error",
          description: `Failed to fetch data: ${errorMessage}`,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.description || !newEvent.candidateId) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields to schedule an interview",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      const response = await axios.post(`${API_BASE_URL}/interviews`, {
        title: newEvent.title,
        description: newEvent.description,
        candidateId: newEvent.candidateId,
        date: newEvent.date.toISOString(),
        status: 'scheduled'
      });

      if (response.data?.success) {
        setInterviews([...interviews, response.data.data]);
        toast({
          title: "Success",
          description: `Interview scheduled successfully for ${format(newEvent.date, 'PPP')}`
        });
        setShowEventDialog(false);
        setNewEvent({ title: '', description: '', candidateId: '', date: new Date() });
      }
    } catch (error) {
      console.error('Error creating interview:', error);
      toast({
        title: "Error",
        description: "Failed to schedule interview. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getInterviewsForDate = (date: Date) => {
    return interviews.filter(interview => 
      isSameDay(parseISO(interview.date), date)
    );
  };

  const todayInterviews = getInterviewsForDate(new Date());
  const selectedDateInterviews = getInterviewsForDate(selectedDate);

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
              
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-medium text-purple-800">Scheduled Interviews</h3>
                  
                  {selectedDateInterviews.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateInterviews.map((interview) => (
                        <div key={interview.id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-purple-900">{interview.title}</h4>
                              <p className="text-sm text-purple-700">{interview.candidateName}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(parseISO(interview.date), 'h:mm a')}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              interview.status === 'scheduled' 
                                ? 'bg-blue-100 text-blue-800' 
                                : interview.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 text-center">
                      <p className="text-sm text-gray-500">
                        No interviews scheduled for {isToday(selectedDate) ? 'today' : 'this date'}.
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => {
                      setNewEvent(prev => ({ ...prev, date: selectedDate }));
                      setShowEventDialog(true);
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 mt-4"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                </div>
              )}
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
              <div className="space-y-2">
                <Select
                  value={newEvent.candidateId}
                  onValueChange={(value) => setNewEvent({ ...newEvent, candidateId: value })}
                  disabled={isLoading || candidates.length === 0}
                >
                  <SelectTrigger className="border-purple-200 focus:ring-purple-500">
                    <SelectValue 
                      placeholder={
                        isLoading 
                          ? 'Loading candidates...' 
                          : candidates.length === 0
                          ? 'No candidates available'
                          : 'Select Candidate'
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-purple-100 max-h-60 overflow-y-auto">
                    {candidates.length > 0 ? (
                      candidates.map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{candidate.name}</span>
                              {candidate.email && (
                                <span className="text-xs text-gray-500 truncate max-w-[120px]" title={candidate.email}>
                                  ({candidate.email})
                                </span>
                              )}
                            </div>
                            {candidate.jobRole && (
                              <span className="text-xs text-gray-500">
                                {candidate.jobRole}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="py-2 px-3 text-sm text-gray-500">
                        No candidates found. Please add candidates first.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {isLoading ? (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading candidates...
                  </p>
                ) : candidates.length === 0 ? (
                  <p className="text-xs text-amber-600">
                    No candidates available. Please add candidates first.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} available
                  </p>
                )}
              </div>
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
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule Interview'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Today's schedule dialog */}
      <InterviewScheduleDialog 
        isOpen={showScheduleDialog} 
        onClose={() => setShowScheduleDialog(false)}
        interviews={todayInterviews}
        isLoading={isLoading}
      />
    </div>
  );
}
