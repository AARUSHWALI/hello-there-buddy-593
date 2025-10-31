import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useLocation } from "react-router-dom";
import UserDetailsDialog from "@/components/users/UserDetailsDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { criteriaApi } from "@/lib/api";

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
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at?: string;
  fitment_score?: number;
  skills?: string[];
  personalityScores?: {
    extraversion: number;
    agreeableness: number;
    openness: number;
    neuroticism: number;
    conscientiousness: number;
  };
  address?: string;
  summary?: string;
  best_fit_for?: string;
  longevity_years?: number;
  candidate_type?: boolean | string | null;
  file_url?: string;
}



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
      extraversion: resume.extraversion || 0,
      agreeableness: resume.agreeableness || 0,
      openness: resume.openness || 0,
      neuroticism: resume.neuroticism || 0,
      conscientiousness: resume.conscientiousness || 0
    },
    status: resume.status || 'pending',
    phone: resume.phone || '',
    address: resume.address || '',
    summary: resume.summary || '',
    best_fit_for: resume.best_fit_for || '',
    created_at: resume.created_at || new Date().toISOString(),
    fitment_score: resume.fitment_score || 0,
    skills: formatSkills(resume.skills),
    candidate_type: resume.candidate_type,
    file_url: resume.file_url,
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
  const [fitmentCriteria, setFitmentCriteria] = useState({ best_fit: 80, average_fit: 50, not_fit: 0 });
  const location = useLocation();

  // Fetch fitment criteria
  useEffect(() => {
    const fetchCriteria = async () => {
      try {
        const data = await criteriaApi.getCriteria();
        setFitmentCriteria({
          best_fit: data.best_fit || 80,
          average_fit: data.average_fit || 50,
          not_fit: data.not_fit || 0
        });
      } catch (error) {
        console.error('Failed to fetch fitment criteria, using defaults', error);
      }
    };
    
    fetchCriteria();
  }, []);
  
  // Determine fitment status based on score
  const getFitmentStatus = (score: number) => {
    if (score >= fitmentCriteria.best_fit) return { status: 'Best Fit', color: 'bg-green-100 text-green-800' };
    if (score >= fitmentCriteria.average_fit) return { status: 'Average Fit', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= fitmentCriteria.not_fit) return { status: 'Not Fit', color: 'bg-red-100 text-red-800' };
    return { status: 'Not Fit', color: 'bg-red-100 text-red-800' };
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📊 Fetching users from Supabase...');
      
      const { data: candidates, error } = await supabase
        .from('candidates' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any;

      if (error) throw error;

      console.log(`✅ Fetched ${candidates?.length || 0} candidates`);
      
      if (candidates && Array.isArray(candidates)) {
        const userProfiles = candidates.map((resume: any) => mapResumeToUserProfile(resume));
        setUsers(userProfiles);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      console.error('Error in fetchUsers:', err);
      setError('Failed to fetch users from database.');
      toast({
        title: "Error",
        description: err?.message || 'Failed to fetch users',
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
                <TableHead>Type</TableHead>
                <TableHead>Suitable For</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Fitment Status</TableHead>
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
                      {/* <img 
                        className="h-10 w-10 rounded-full object-cover" 
                        src={user.profileImage} 
                        alt={user.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                        }}
                      /> */}
                      <div>
                        <div className="font-medium">{user.name}</div>
                        {/* {user.education && (
                          <span className="text-xs text-gray-500">
                            {user.education}
                          </span>
                        )} */}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const candidateType = user.candidate_type;
                      
                      if (candidateType === true) {
                        return <div className="text-sm text-gray-900">Experienced</div>;
                      } else if (candidateType === false) {
                        return <div className="text-sm text-gray-900">Fresher</div>;
                      } else if (candidateType === null || candidateType === undefined) {
                        return <div className="text-sm text-gray-900">Not specified</div>;
                      } else if (typeof candidateType === 'string' && candidateType.toLowerCase() === 'not specified') {
                        return <div className="text-sm text-gray-900">Not specified</div>;
                      } else {
                        // Fallback for any other values
                        return <div className="text-sm text-gray-900">Fresher</div>;
                      }
                    })()}
                  </TableCell>
                  <TableCell>
                    {user.jobRole ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {user.jobRole}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Not specified</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.fitment_score !== undefined ? (
                      <span className="font-medium">{user.fitment_score.toFixed(1)}%</span>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {user.fitment_score !== undefined ? (
                      <Badge className={getFitmentStatus(user.fitment_score).color}>
                        {getFitmentStatus(user.fitment_score).status}
                      </Badge>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(user);
                      }}
                    >
                      View Details
                    </Button>
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
