export interface User {
  id: number;
  email: string;
}

export interface Workout {
  id: number;
  user_id: number;
  title: string;
  description: string;
  scheduled_time: string; // ISO string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export interface CalendarToken {
  id: number;
  user_id: number;
  provider: 'google' | 'outlook';
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  connected: boolean;
}

export interface Reminder {
  id: number;
  workout_id: number;
  workout_title?: string;
  phone_number: string;
  trigger_time: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface FoodLog {
  id: number;
  user_id: number;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fluid_volume_ml?: number;
  scanned_at: string;
}

export interface HydrationLog {
  id: number;
  user_id: number;
  fluid_type: string;
  volume_ml: number;
  calories_added: number;
  logged_at: string;
}

