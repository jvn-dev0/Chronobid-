// ─────────────────────────────────────────────────────────
// ChronoBid API Service
// Connects the frontend to the FastAPI backend
// Backend runs on: http://localhost:8000
// ─────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ── Types ──────────────────────────────────────────────────
export interface RegisterPayload {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  role: string; // "buyer" or "seller"
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: string;
  user_id: number;
}

export interface RegisterResponse {
  message: string;
  user_id: number;
}

export interface ApiError {
  detail: string;
}

// ── Helper ─────────────────────────────────────────────────
async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    const error = data as ApiError;
    throw new Error(error.detail || 'Something went wrong. Please try again.');
  }
  return data as T;
}

// ── Auth API Calls ─────────────────────────────────────────

/**
 * Register a new user.
 * Sends data to POST /api/auth/register
 * Creates the user in Supabase and auto-creates their Wallet.
 */
export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<RegisterResponse>(res);
}

/**
 * Login an existing user.
 * Sends data to POST /api/auth/login
 * Returns a JWT Token + role (buyer or seller)
 */
export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthResponse>(res);
}

// ── Token Storage ──────────────────────────────────────────

/** Save the JWT token and user info to localStorage after login */
export function saveSession(data: AuthResponse) {
  localStorage.setItem('chronobid_token', data.access_token);
  localStorage.setItem('chronobid_role', data.role);
  localStorage.setItem('chronobid_user_id', String(data.user_id));
}

/** Get the saved JWT token */
export function getToken(): string | null {
  return localStorage.getItem('chronobid_token');
}

/** Get the saved user role */
export function getRole(): string | null {
  return localStorage.getItem('chronobid_role');
}

/** Clear the session on logout */
export function clearSession() {
  localStorage.removeItem('chronobid_token');
  localStorage.removeItem('chronobid_role');
  localStorage.removeItem('chronobid_user_id');
}
