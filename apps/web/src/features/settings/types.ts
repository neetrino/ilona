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
  email?: string;
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

export interface ManagerAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
  createdAt: string;
  managerProfile?: {
    centerId: string;
    center?: {
      id: string;
      name: string;
    };
  };
}

export interface CreateManagerDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  centerId: string;
}
