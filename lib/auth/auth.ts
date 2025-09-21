import { Session } from '@/lib/types';

export async function getSession(): Promise<Session | null> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function logout() {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.ok) {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

export function getLoginUrl() {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_AUTH_CLIENT_ID || '',
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/api/auth/callback`,
    response_type: 'code',
  });

  return `${process.env.NEXT_PUBLIC_AUTH_URL || ''}/auth/authorize?${params.toString()}`;
}