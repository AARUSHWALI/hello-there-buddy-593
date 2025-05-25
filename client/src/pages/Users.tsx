import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useLocation } from "react-router-dom";
import UserDetailsDialog from "@/components/users/UserDetailsDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  score: number;
  jobRole?: string;
  experience?: string;
  education?: string;
  about?: string;
  profileImage?: string;
  personalityScores?: {
    extroversion: number;
    agreeableness: number;
    openness: number;
    neuroticism: number;
    conscientiousness: number;
  };
  phone?: string;
  address?: string;
  summary?: string;
  best_fit_for?: string;
  created_at?: string;
  fitment_score?: number;
  skills?: string[];
}

const API_BASE_URL = 'http://localhost:5000/api';

const mapResumeToUserProfile = (resume: any): UserProfile => {
  // Format education if it's an array
  const formatEducation = (edu: any[] | string | undefined): string => {
    if (!edu) return '';
    if (typeof edu === 'string') return edu;
    if (Array.isArray(edu) && edu.length > 0) {
      // Get the highest degree
      const highestDegree = edu[0];
      return `${highestDegree.degree} in ${highestDegree.field || ''} from ${highestDegree.institution || ''}`.trim();
    }
    return '';
  };

  // in experience display this feild ${longevity_years} years
  const formatExperience = (exp: any[] | string | undefined): string => {
    if (!exp) return 'No experience';
    if (typeof exp === 'string') return exp;
    return `${exp} years`;
  };

  // Format skills if it's an array
  const formatSkills = (skills: any[] | undefined): string[] => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    return [];
  };

  return {
    id: resume.id || '',
    name: resume.name || 'Unknown',
    email: resume.email || '',
    score: resume.fitment_score || 0,
    jobRole: resume.best_fit_for || 'Not Specified',
    experience: formatExperience(resume.longevity_years),
    education: formatEducation(resume.education),
    about: resume.summary || 'No summary available',
    profileImage: '',
    personalityScores: {
      extroversion: resume.extroversion || 0,
      agreeableness: resume.agreeableness || 0,
      openness: resume.openness || 0,
      neuroticism: resume.neuroticism || 0,
      conscientiousness: resume.conscientiousness || 0
    },
    phone: resume.phone || '',
    address: resume.address || '',
    summary: resume.summary || '',
    best_fit_for: resume.best_fit_for || '',
    created_at: resume.created_at || new Date().toISOString(),
    fitment_score: resume.fitment_score || 0,
    skills: formatSkills(resume.skills)
  };
};

const PersonalityBar = ({
  label,
  value
}: {
  label: string;
  value: number;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-blue-500 h-2 rounded-full" 
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export default function Users() {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/resumes`);
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        const userProfiles = response.data.data.map((resume: any) => mapResumeToUserProfile(resume));
        setUsers(userProfiles);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error in fetchUsers:', err);
      setError('Failed to fetch users. Please make sure the backend server is running.');
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to connect to the server',
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for selectedId in URL query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const selectedId = queryParams.get('selected');
    
    if (selectedId) {
      const user = users.find(u => u.id === selectedId);
      if (user) {
        setSelectedUser(user);
      }
    }
  }, [location.search, users]);

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b">
          <div>
            <h1 className="text-2xl font-bold">Candidates</h1>
            <p className="text-gray-500 mt-1">{users.length} candidates found</p>
          </div>
          <Button 
            onClick={fetchUsers} 
            variant="outline" 
            size="icon"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Suitable For</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow 
                  key={user.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <img 
                        className="h-10 w-10 rounded-full object-cover" 
                        src={user.profileImage} 
                        alt={user.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                        }}
                      />
                      <div>
                        <div className="font-medium">{user.name}</div>
                        {user.education && (
                          <span className="text-xs text-gray-500">
                            {user.education}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                  </TableCell>
                  <TableCell>
                    {user.best_fit_for ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {user.best_fit_for}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Not specified</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.fitment_score !== undefined && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.fitment_score > 80 ? 'bg-green-100 text-green-800' : 
                        user.fitment_score > 60 ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.fitment_score.toFixed(1)}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {selectedUser && (
          <UserDetailsDialog
            isOpen={true}
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </div>
    </div>
  );
}
