// Ecosystem-related types
export interface Ecosystem {
  id: number;
  Id?: number; // NocoDB sometimes returns capital Id
  name: string;
  theme: string;
  description?: string;
  active_status: boolean;
  created_at?: string;
  updated_at?: string;
  platform_count?: number;
  user_count?: number;
}

export interface UserEcosystem {
  user_id: number;
  ecosystem_id: number;
  ecosystem: {
    id: number;
    name: string;
  };
  assigned_at?: string;
}

export interface EcosystemWithPlatforms extends Ecosystem {
  platforms?: Platform[];
}

export interface Platform {
  id: number;
  Id?: number; // NocoDB sometimes returns capital Id
  platform_name: string;
  platform_type: string;
  profile_id?: string;
  username?: string;
  password?: string;
  profile_url?: string;
  totp_enabled?: boolean;
  totp_secret?: string;
  ecosystem_id?: number;
  ecosystem?: {
    id: number;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
  changed_by?: number;
}

export interface PlatformActivity {
  icon: React.ComponentType;
  text: string;
  time: string;
  color: string;
}

export interface DashboardStats {
  summary: {
    totalUsers: number;
    totalEcosystems: number;
    activeEcosystems: number;
    totalPlatforms: number;
    platformsWithCredentials: number;
    totpEnabledPlatforms: number;
  };
  themes: Array<{ name: string; count: number }>;
  platformTypes: Array<{ type: string; count: number }>;
  activeStandardPlatforms: Array<{ platform: string; count: number }>;
  standardPlatformTypes: string[];
  matrix: Array<{
    ecosystemId: number;
    ecosystemName: string;
    ecosystemTheme: string;
    activeStatus: boolean;
    platforms: Record<string, {
      configured: boolean;
      hasCredentials: boolean;
      totpEnabled: boolean;
      count: number;
    }>;
    totalConfigured: number;
  }>;
}

export interface StandardPlatform {
  name: string;
  category: string;
  urlFormat: string;
  requiresPrefix?: string;
  note?: string;
}