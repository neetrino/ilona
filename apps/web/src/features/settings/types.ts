export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string | null;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  lessonReminders: boolean;
  paymentReminders: boolean;
  feedbackAlerts: boolean;
}

export interface AppSettings {
  language: 'en' | 'hy';
  theme: 'light' | 'dark' | 'system';
  timezone: string;
}
