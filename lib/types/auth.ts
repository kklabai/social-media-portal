// Authentication-related types
export interface User {
  id: number;
  dbId?: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  ecitizen_id?: string;
  image?: string;
  created_at?: string;
}

export interface Session {
  user: User;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}