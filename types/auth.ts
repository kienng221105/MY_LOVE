export interface User {
  id: string;
  name: string;
  partnerName: string;
  anniversaryDate: string; // ISO date string e.g. "2023-12-24"
  avatarUrl?: string;
  partnerAvatarUrl?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  magicPhrase: string;
}
