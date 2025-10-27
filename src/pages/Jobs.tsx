import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, ChevronLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface Job {
  id: string;
  title: string;
  active: boolean;
  description?: string;
  requirements?: string[];
}

const initialJobs: Job[] = [
  { 
    id: "1", 
    title: "Professor in School of Law", 
    active: false,
    description: "Teaching and Curriculum Development:\n- Develop and deliver engaging lectures, seminars, and practical sessions in Law related subjects.\n- Design and revise course curriculum to align with industry trends and academic standards.\n- Mentor and supervise undergraduate and postgraduate students in their academic pursuits.",
    requirements: [
      "A Ph.D. in Law or a related field from a recognized institution.",
      "A minimum of 10 years of teaching and research experience in higher education including 03 years of experience as Associate Professor, with significant contributions to the field.",
      "Demonstrated leadership in academic and research activities.",
      "Experience in guiding and mentoring students and junior faculty members.",
      "Proven ability to secure research grants and foster interdisciplinary collaborations."
    ]
  },
  { 
    id: "2", 
    title: "Associate Professor in School of Law", 
    active: false,
    description: "Teaching and Curriculum Development:\n- Teaching and delivering lectures in law-related subjects\n- Developing course materials and curriculum\n- Mentoring students and junior faculty",
    requirements: [
      "A Masters degree in Law or a related field with 55% minimum marks",
      "A Ph.D. in Law or a related field from a recognized institution",
      "Minimum of 08 years teaching experience",
      "Evidence of scholarly achievements",
      "Experience in curriculum development"
    ]
  },
  { 
    id: "3", 
    title: "Professor", 
    active: false,
    description: "MIET invites applications for the position of Associate Professor/ Assistant Professor in the various departments. The successful candidate will have a distinguished record of teaching, scholarly research, and service.",
    requirements: [
      "Ph.D. in your area of expertise",
      "Demonstrated excellence in teaching",
      "Evidence of scholarly research",
      "Strong communication skills",
      "Ability to work in a collaborative environment"
    ]
  },
  { 
    id: "4", 
    title: "Professor in School of Management", 
    active: true,
    description: "Teaching and Curriculum Development:\n- Develop and deliver engaging lectures, seminars, and workshops in various areas of management\n- Create and update course materials\n- Employ innovative teaching methodologies",
    requirements: [
      "Ph.D. in Management or related field",
      "10 years of teaching and research experience",
      "Leadership in academic and research spheres",
      "Experience in curriculum development",
      "Proven ability to secure research grants"
    ]
  },
];

export default function Jobs() {
  const [jobs, setJobs] = useState(initialJobs);
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requirements: ''
  });

  const handleSubmitJob = () => {
    setShowNewJobDialog(false);
    setNewJob({ title: '', description: '', requirements: '' });
  };

  const handleToggleActive = (id: string) => {
    setJobs(jobs.map(job => 
      job.id === id ? { ...job, active: !job.active } : job
    ));
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    setShowViewDialog(true);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (selectedJob) {
      setJobs(jobs.filter(job => job.id !== selectedJob.id));
      setShowViewDialog(false);
      setSelectedJob(null);
    }
  };

  const handleSaveEdit = () => {
    if (selectedJob) {
      setJobs(jobs.map(job => 
        job.id === selectedJob.id ? selectedJob : job
      ));
      setIsEditing(false);
    }
  };

  return (
    <div className="page-container p-4 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200">
        <div className="p-4 flex justify-between items-center border-b border-gray-200 bg-gradient-to-r from-blue-50 via-white to-blue-50">
          <h1 className="text-2xl font-bold text-gray-800">Job Listings</h1>
          <Button size="icon" variant="outline" className="hover:bg-blue-100 transition-colors duration-200">
            <RefreshCw size={16} className="text-gray-700" />
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="bg-blue-500 hover:bg-blue-600"
                        onClick={() => handleViewJob(job)}
                      >
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDelete()}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch 
                      checked={job.active} 
                      onCheckedChange={() => handleToggleActive(job.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="p-4">
          <Button 
            className="bg-blue-500 hover:bg-blue-600"
            onClick={() => setShowNewJobDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Job
          </Button>
        </div>
      </div>

      {/* Add New Job Dialog */}
      <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Job</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Input
                placeholder="Job Title"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
              />
            </div>
            
            <div>
              <Textarea
                placeholder="Job Description"
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            
            <div>
              <Textarea
                placeholder="Job Requirements"
                value={newJob.requirements}
                onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowNewJobDialog(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-blue-500 hover:bg-blue-600"
                onClick={handleSubmitJob}
              >
                Add Job
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View/Edit Job Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setShowViewDialog(false);
                  setSelectedJob(null);
                  setIsEditing(false);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>{selectedJob?.title}</span>
              <Button 
                size="icon" 
                variant="outline" 
                className="ml-auto"
              >
                <RefreshCw size={16} />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                {isEditing ? (
                  <Textarea
                    value={selectedJob.description}
                    onChange={(e) => setSelectedJob({
                      ...selectedJob,
                      description: e.target.value
                    })}
                    className="min-h-[200px]"
                  />
                ) : (
                  <div className="whitespace-pre-line">
                    {selectedJob.description}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                {isEditing ? (
                  <Textarea
                    value={selectedJob.requirements?.join("\n")}
                    onChange={(e) => setSelectedJob({
                      ...selectedJob,
                      requirements: e.target.value.split("\n").filter(r => r.trim())
                    })}
                    className="min-h-[200px]"
                  />
                ) : (
                  <ul className="list-disc pl-6 space-y-2">
                    {selectedJob.requirements?.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-blue-500 hover:bg-blue-600"
                      onClick={handleSaveEdit}
                    >
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline"
                      onClick={handleEdit}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleDelete}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
