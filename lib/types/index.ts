export interface User {
  id: number;
  ecitizen_id?: string | null;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Ecosystem {
  id: number;
  name: string;
  theme: string;
  description?: string | null;
  active_status: boolean;
  custom_metadata?: Record<string, any>;
  created_at: string | Date;
  updated_at: string | Date;
  platforms?: SocialMediaPlatform[];
  userEcosystems?: UserEcosystem[];
}

export interface UserEcosystem {
  id: number;
  user_id: number;
  ecosystem_id: number;
  assigned_by?: number | null;
  assigned_at: string | Date;
  user?: User;
  ecosystem?: Ecosystem;
}

export interface SocialMediaPlatform {
  id: number;
  ecosystem_id: number;
  platform_name: string;
  platform_type?: string | null;
  account_status?: string | null;
  profile_id?: string | null;
  username?: string | null;
  password?: string | null;
  email?: string | null;
  profile_url?: string | null;
  totp_secret?: string | null;
  totp_enabled: boolean;
  two_fa_enabled: boolean;
  verification_status?: string | null;
  notes?: string | null;
  custom_table_name?: string | null;
  custom_fields?: Record<string, any>;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface CredentialHistory {
  id: string;
  platform_id: string;
  field_name: 'username' | 'password' | 'profile_id';
  old_value?: string;
  new_value?: string;
  changed_by: string;
  changed_at: string;
  changed_by_user?: User;
}

export interface EmailID {
  id: string;
  user_id: string;
  email: string;
  purpose: 'notifications' | 'updates';
  is_primary: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  authenticated: boolean;
  user?: User;
  permissions?: string[];
}

export interface CustomFieldDefinition {
  id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'tags' | 'textarea';
  label: string;
  required: boolean;
  options?: string[]; // For dropdown and tags
  default_value?: any;
  order: number;
}

export interface PlatformTemplate {
  id: string;
  platform_type: string;
  custom_fields: CustomFieldDefinition[];
  created_at: string;
  updated_at: string;
}