
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
