
// Define the common interfaces for all data models

export interface BaseModel {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Task extends BaseModel {
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  priority?: string;
}

export interface Habit extends BaseModel {
  title: string;
  description?: string;
  frequency: string;
  target: number;
  streak: number;
  last_completed_at?: string;
  category?: string;
}

export interface Goal extends BaseModel {
  title: string;
  description?: string;
  target_date?: string;
  completed: boolean;
  progress: number;
  category?: string;
}

export interface JournalEntry extends BaseModel {
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
}

export interface FocusSession extends BaseModel {
  title?: string;
  duration: number;
  started_at?: string;
  completed_at?: string;
}

export interface UserSettings {
  id: string;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  focus_mode: boolean;
  theme: string;
  language: string;
  clock_format: string;
  karma_points?: number;
  unlocked_features?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  display_name?: string;
  email?: string;
  photo_url?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionInfo {
  id?: string;
  user_id?: string;
  subscribed: boolean;
  subscription_end?: string;
  stripe_customer_id?: string;
  subscription_tier?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at?: string;
}
