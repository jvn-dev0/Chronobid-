export const ADMIN_CONFIG = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  backgroundImagePath: "/images/admin-login-background.jpg",
  tokenKey: "chronobid_admin_token",
  userKey: "chronobid_admin_user",
};

export interface AdminUser {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export async function loginAdmin(email: string, password: string): Promise<AdminLoginResponse> {
  const response = await fetch(`${ADMIN_CONFIG.apiBaseUrl}/api/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Authentication failed. Please check admin credentials.");
  }

  // Save session securely
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_CONFIG.tokenKey, data.access_token);
    localStorage.setItem(
      ADMIN_CONFIG.userKey,
      JSON.stringify({
        user_id: data.user_id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
      })
    );
    // Set cookie for server-side auth guards
    document.cookie = `${ADMIN_CONFIG.tokenKey}=${data.access_token}; path=/; max-age=2592000; SameSite=Lax`;
  }

  return data;
}

export function logoutAdmin() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ADMIN_CONFIG.tokenKey);
    localStorage.removeItem(ADMIN_CONFIG.userKey);
    document.cookie = `${ADMIN_CONFIG.tokenKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    window.location.href = "/";
  }
}

export function getAdminSession(): { token: string | null; user: AdminUser | null } {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }
  const token = localStorage.getItem(ADMIN_CONFIG.tokenKey);
  const userStr = localStorage.getItem(ADMIN_CONFIG.userKey);
  const user = userStr ? JSON.parse(userStr) : null;
  return { token, user };
}
