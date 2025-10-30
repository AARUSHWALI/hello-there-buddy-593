
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
    extraversion: number;
    agreeableness: number;
    openness: number;
    neuroticism: number;
    conscientiousness: number;
  };
}

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      console.log('📊 Fetching users from Supabase...');
      
      const { data: candidates, error } = (await supabase
        .from('candidates' as any)
        .select('*')
        .order('created_at', { ascending: false })) as any;

      if (error) throw error;

      console.log(`✅ Fetched ${candidates?.length || 0} candidates`);

      // Map candidates to UserProfile format
      const mappedUsers: UserProfile[] = (candidates || []).map((candidate: any) => ({
        id: candidate.id,
        name: candidate.name || 'Unknown',
        email: candidate.email || '',
        score: candidate.fitment_score || 0,
        jobRole: candidate.best_fit_for,
        experience: candidate.longevity_years ? `${candidate.longevity_years}+ Years` : undefined,
        education: candidate.education ? JSON.stringify(candidate.education) : undefined,
        about: candidate.summary,
        profileImage: undefined,
        personalityScores: {
          extraversion: candidate.extraversion || 0,
          agreeableness: candidate.agreeableness || 0,
          openness: candidate.openness || 0,
          neuroticism: candidate.neuroticism || 0,
          conscientiousness: candidate.conscientiousness || 0,
        }
      }));

      setUsers(mappedUsers);
    } catch (error) {
      toast({
        title: "Error fetching users",
        description: "Please try again later.",
        variant: "destructive",
      });
      console.error('❌ Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, isLoading, fetchUsers };
}
