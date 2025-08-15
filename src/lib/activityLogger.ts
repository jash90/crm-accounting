import { supabase } from '@/lib/supabase';
import type { ActivityLog } from '@/types/supabase';

type ActivityData = {
  action_type: 'created' | 'updated' | 'deleted' | 'enabled' | 'disabled';
  resource_type: 'module' | 'contact' | 'invite' | 'client';
  resource_name: string;
  details?: Record<string, any>;
};

export const logActivity = async (activityData: ActivityData): Promise<void> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user profile to get company_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.company_id) return;

    // Insert activity log
    await supabase
      .from('activity_logs')
      .insert([{
        user_id: user.id,
        company_id: userProfile.company_id,
        ...activityData,
      }]);
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error - logging failure shouldn't break the main operation
  }
};