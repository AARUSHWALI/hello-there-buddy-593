import { supabase } from '@/integrations/supabase/client';

export interface FitmentCriteria {
  id: string;
  best_fit: number;
  average_fit: number;
  not_fit: number;
  created_at: string;
  updated_at: string;
}

export const criteriaApi = {
  // Get current criteria
  getCriteria: async (): Promise<FitmentCriteria> => {
    const { data, error } = await supabase.functions.invoke('get-criteria', {
      method: 'GET'
    });
    
    if (error) throw error;
    return data;
  },

  // Update criteria
  updateCriteria: async (updateData: {
    best_fit: number;
    average_fit: number;
    not_fit: number;
  }): Promise<FitmentCriteria> => {
    const { data, error } = await supabase.functions.invoke('get-criteria', {
      method: 'PUT',
      body: updateData
    });
    
    if (error) throw error;
    return data;
  },
};
