import { Platform } from 'react-native';

const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:4000/api',
  default: 'http://localhost:4000/api',
});

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: AuthenticatedUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error('Unable to reach the server. Check that the backend is running.');
  }

  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    token?: string;
    user?: AuthenticatedUser;
  };

  if (!response.ok) {
    throw new Error(data.message ?? 'Login failed. Please try again.');
  }
  if (!data.token || !data.user?.id || !data.user.name) {
    throw new Error('The server returned an invalid login response.');
  }

  return { token: data.token, user: data.user };
}