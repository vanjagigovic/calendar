export type ResponseStyle = 'concise' | 'balanced' | 'detailed';

export interface UserProfile {
  userId: string;
  profession: string | null;
  interests: string[];
  responseStyle: ResponseStyle;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpdateProfileRequest {
  profession?: string | null;
  interests?: string[];
  responseStyle?: ResponseStyle;
}