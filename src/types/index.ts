export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  category?: string;
  target: number;
  streak?: number;
  last_completed_at?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  is_completed_today?: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  target_date?: string;
  progress: number;
  completed: boolean;
  created_at: string;
  updated_at?: string;
  user_id: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood?: string;
  tags?: any;
  created_at: string;
  updated_at?: string;
  user_id: string;
}

export interface GoodAction {
  id: string;
  title: string;
  description?: string;
  category: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  is_public: boolean;
  impact_level?: 'low' | 'medium' | 'high';
  date_performed?: string;
  user_profiles?: {
    display_name: string | null;
    email: string | null;
    photo_url?: string | null;
  } | null;
}

export interface GoodActionComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  good_action_id: string;
  is_deleted: boolean;
  user_profiles?: {
    display_name: string | null;
    email: string | null;
  } | null;
}

export interface GoodActionLike {
  id: string;
  user_id: string;
  good_action_id: string;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  created_at: string;
}

export interface UserSettings {
  id: string;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  focus_mode: boolean;
  karma_points: number;
  unlocked_features: any[];
  theme: string;
  language: string;
  clock_format: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  photo_url: string | null;
  bio: string | null;
  created_at?: string;
  updated_at?: string;
}
