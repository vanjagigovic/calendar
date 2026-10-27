import { apiRequest } from './api-client';
import type {
  UpdateProfileRequest,
  UserProfile,
} from '../types/profile-api-types';

export function getProfile(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/profile', {
    method: 'GET',
  });
}

export function updateProfile(
  data: UpdateProfileRequest,
): Promise<UserProfile> {
  return apiRequest<UserProfile>('/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}