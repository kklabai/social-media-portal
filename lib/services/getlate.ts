export interface GetlateProfile {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface GetlatePlatform {
  platform: string;
  username: string;
  profile_url?: string;
  connected: boolean;
}

export interface GetlatePost {
  id: string;
  profile_id: string;
  platforms: string[];
  content: string;
  status: 'scheduled' | 'published' | 'failed';
  scheduled_at?: string;
  published_at?: string;
  created_at: string;
}

export interface GetlateStats {
  profile_id: string;
  platform: string;
  posts_count: number;
  date_from: string;
  date_to: string;
}

class GetlateService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.GETLATE_API_KEY || '';
    this.apiUrl = process.env.GETLATE_API_URL || 'https://getlate.dev/api';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Getlate API key not configured');
    }

    // Mock mode for testing when API key starts with 'mock-' or 'your-'
    if (this.apiKey.startsWith('mock-') || this.apiKey.startsWith('your-')) {
      return this.mockRequest(endpoint);
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Getlate API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  private async mockRequest<T>(endpoint: string): Promise<T> {
    // Mock responses for testing
    if (endpoint === '/v1/profiles') {
      return [
        { id: 'prof-1', name: 'Music Education', created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: 'prof-2', name: 'Culture & Heritage', created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: 'prof-3', name: 'Youth & Sports', created_at: '2024-01-01', updated_at: '2024-01-01' },
      ] as T;
    }
    
    if (endpoint.startsWith('/v1/posts')) {
      const mockPosts = [
        {
          id: 'post-1',
          profile_id: 'prof-1',
          platforms: ['Facebook', 'Instagram'],
          content: 'New music program launch',
          status: 'published' as const,
          published_at: '2024-03-15',
          created_at: '2024-03-14',
        },
        {
          id: 'post-2',
          profile_id: 'prof-1',
          platforms: ['Twitter', 'LinkedIn'],
          content: 'Music festival announcement',
          status: 'published' as const,
          published_at: '2024-03-16',
          created_at: '2024-03-15',
        },
        {
          id: 'post-3',
          profile_id: 'prof-2',
          platforms: ['Facebook', 'Instagram', 'Twitter'],
          content: 'Heritage site preservation update',
          status: 'published' as const,
          published_at: '2024-03-17',
          created_at: '2024-03-16',
        },
      ];
      
      // Filter by query params if needed
      const url = new URL(`http://localhost${endpoint}`);
      const profileId = url.searchParams.get('profile_id');
      
      let filtered = mockPosts;
      if (profileId) {
        filtered = filtered.filter(p => p.profile_id === profileId);
      }
      
      return filtered as T;
    }
    
    throw new Error(`Mock endpoint not implemented: ${endpoint}`);
  }

  async getProfiles(): Promise<GetlateProfile[]> {
    interface ProfileResponse {
      profiles: Array<{
        _id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
      }>;
    }
    const response = await this.request<ProfileResponse>('/v1/profiles');
    // Map the response to match our expected format
    return response.profiles.map(profile => ({
      id: profile._id,
      name: profile.name,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
    }));
  }

  async getProfile(profileId: string): Promise<GetlateProfile> {
    return this.request<GetlateProfile>(`/v1/profiles/${profileId}`);
  }

  async getPosts(params: {
    profile_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<GetlatePost[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    try {
      interface PostResponse {
        posts?: Array<{
          _id?: string;
          id?: string;
          profileId?: string;
          profile_id?: string;
          platforms?: string[];
          content?: string;
          status?: string;
          scheduledAt?: string;
          scheduled_at?: string;
          publishedAt?: string;
          published_at?: string;
          createdAt?: string;
          created_at?: string;
        }>;
      }
      const response = await this.request<PostResponse | GetlatePost[]>(`/v1/posts?${queryParams}`);
      // Handle different response formats
      if (Array.isArray(response)) {
        return response;
      } else if (response && Array.isArray(response.posts)) {
        // Map the response to our expected format
        return response.posts.map((post) => ({
          id: post._id || post.id || '',
          profile_id: post.profileId || post.profile_id || '',
          platforms: post.platforms || [],
          content: post.content || '',
          status: (post.status || 'published') as 'scheduled' | 'published' | 'failed',
          scheduled_at: post.scheduledAt || post.scheduled_at,
          published_at: post.publishedAt || post.published_at,
          created_at: post.createdAt || post.created_at || '',
        }));
      }
      // If no posts found, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  }

  async getProfileStats(profileId: string, dateFrom: string, dateTo: string): Promise<GetlateStats[]> {
    const posts = await this.getPosts({
      profile_id: profileId,
      status: 'published',
      date_from: dateFrom,
      date_to: dateTo,
    });

    // Group posts by platform and count
    const platformStats = new Map<string, number>();
    
    posts.forEach(post => {
      post.platforms.forEach(platform => {
        platformStats.set(platform, (platformStats.get(platform) || 0) + 1);
      });
    });

    return Array.from(platformStats.entries()).map(([platform, count]) => ({
      profile_id: profileId,
      platform,
      posts_count: count,
      date_from: dateFrom,
      date_to: dateTo,
    }));
  }

  async getAllProfilesStats(dateFrom: string, dateTo: string): Promise<{
    profiles: Array<{
      profile: GetlateProfile;
      stats: GetlateStats[];
      total_posts: number;
    }>;
    summary: {
      total_profiles: number;
      total_posts: number;
      platforms_breakdown: Record<string, number>;
    };
  }> {
    const profiles = await this.getProfiles();
    const profilesWithStats = await Promise.all(
      profiles.map(async (profile) => {
        const stats = await this.getProfileStats(profile.id, dateFrom, dateTo);
        const totalPosts = stats.reduce((sum, stat) => sum + stat.posts_count, 0);
        return {
          profile,
          stats,
          total_posts: totalPosts,
        };
      })
    );

    // Calculate summary
    const platformsBreakdown: Record<string, number> = {};
    let totalPosts = 0;

    profilesWithStats.forEach(({ stats }) => {
      stats.forEach(stat => {
        platformsBreakdown[stat.platform] = (platformsBreakdown[stat.platform] || 0) + stat.posts_count;
        totalPosts += stat.posts_count;
      });
    });

    return {
      profiles: profilesWithStats,
      summary: {
        total_profiles: profiles.length,
        total_posts: totalPosts,
        platforms_breakdown: platformsBreakdown,
      },
    };
  }
}

export const getlateService = new GetlateService();