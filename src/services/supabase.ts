import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库表结构
export interface TravelPlan {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  travelers: number;
  preferences: string;
  itinerary: any;
  created_at: string;
  updated_at: string;
}


// 旅行计划相关操作
export const travelPlanService = {
  async getPlans(userId: string): Promise<TravelPlan[]> {
    const { data, error } = await supabase
      .from('travel_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getPlan(id: string): Promise<TravelPlan | null> {
    const { data, error } = await supabase
      .from('travel_plans')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createPlan(plan: Omit<TravelPlan, 'id' | 'created_at' | 'updated_at'>): Promise<TravelPlan> {
    const { data, error } = await supabase
      .from('travel_plans')
      .insert(plan)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePlan(id: string, updates: Partial<TravelPlan>): Promise<TravelPlan> {
    const { data, error } = await supabase
      .from('travel_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deletePlan(id: string): Promise<void> {
    const { error } = await supabase
      .from('travel_plans')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};


