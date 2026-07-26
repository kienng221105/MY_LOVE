export interface User {
  id: string;
  name: string;
  partnerName: string;
  anniversaryDate: string; // ISO-8601 UTC string e.g. "2023-12-24T00:00:00.000Z"
  avatarUrl?: string;
  partnerAvatarUrl?: string;
  timerVersion?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  magicPhrase: string;
}
