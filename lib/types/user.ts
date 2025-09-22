// User management types
import { UserEcosystem } from './ecosystem';

export interface UserWithEcosystems {
  id: number;
  name: string;
  email: string;
  ecitizen_id?: string;
  role: string;
  created_at: string;
  ecosystem_count?: number;
  userEcosystems?: UserEcosystem[];
}

export interface UserPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}