const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('globetrotter_token');
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('globetrotter_token', token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('globetrotter_token');
  }
}

export function getStoredUser(): any | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('globetrotter_user');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

export function setStoredUser(user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('globetrotter_user', JSON.stringify(user));
  }
}

export function removeStoredUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('globetrotter_user');
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error: any = new Error(data.error || 'An unexpected error occurred');
    error.status = response.status;
    throw error;
  }

  return data as T;
}
