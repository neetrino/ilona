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
  teacher?: {
    id: string;
    videoUrl?: string | null;
  } | null;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string | null;
  email?: string;
  videoUrl?: string | null;
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
