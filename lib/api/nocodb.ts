import axios from 'axios';

const nocodbApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NOCODB_API_URL,
  headers: {
    'xc-token': process.env.NOCODB_API_TOKEN,
    'Content-Type': 'application/json',
  },
});

export class NocoDBClient {
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  // Generic CRUD operations
  async list(tableName: string, params?: any) {
    const response = await nocodbApi.get(
      `/db/data/v1/${this.projectId}/${tableName}`,
      { params }
    );
    return response.data;
  }

  async read(tableName: string, id: string) {
    const response = await nocodbApi.get(
      `/db/data/v1/${this.projectId}/${tableName}/${id}`
    );
    return response.data;
  }

  async create(tableName: string, data: any) {
    const response = await nocodbApi.post(
      `/db/data/v1/${this.projectId}/${tableName}`,
      data
    );
    return response.data;
  }

  async update(tableName: string, id: string, data: any) {
    const response = await nocodbApi.patch(
      `/db/data/v1/${this.projectId}/${tableName}/${id}`,
      data
    );
    return response.data;
  }

  async delete(tableName: string, id: string) {
    const response = await nocodbApi.delete(
      `/db/data/v1/${this.projectId}/${tableName}/${id}`
    );
    return response.data;
  }

  // Bulk operations
  async bulkCreate(tableName: string, data: any[]) {
    const response = await nocodbApi.post(
      `/db/data/v1/${this.projectId}/${tableName}/bulk`,
      data
    );
    return response.data;
  }

  async bulkUpdate(tableName: string, data: any[]) {
    const response = await nocodbApi.patch(
      `/db/data/v1/${this.projectId}/${tableName}/bulk`,
      data
    );
    return response.data;
  }

  async bulkDelete(tableName: string, ids: string[]) {
    const response = await nocodbApi.delete(
      `/db/data/v1/${this.projectId}/${tableName}/bulk`,
      { data: { ids } }
    );
    return response.data;
  }
}

// Table names
export const TABLES = {
  USERS: 'users',
  ECOSYSTEMS: 'ecosystems',
  USER_ECOSYSTEMS: 'user_ecosystems',
  SOCIAL_MEDIA_PLATFORMS: 'social_media_platforms',
  CREDENTIAL_HISTORY: 'credential_history',
  EMAIL_IDS: 'email_ids',
  PLATFORM_TEMPLATES: 'platform_templates',
};

// Create a default client instance
export const nocodb = new NocoDBClient(process.env.NEXT_PUBLIC_NOCODB_PROJECT_ID || 'default');