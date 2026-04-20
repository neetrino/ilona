export type DailyPlanResourceKind = 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING';

export interface DailyPlanResource {
  id: string;
  kind: DailyPlanResourceKind;
  title: string;
  link: string | null;
  description: string | null;
}

export interface DailyPlanTopic {
  id: string;
  title: string;
  order: number;
  resources: DailyPlanResource[];
}

export interface DailyPlanGroupRef {
  id: string;
  name: string;
  level: string | null;
}

export interface DailyPlanLessonRef {
  id: string;
  scheduledAt: string;
}

export interface DailyPlanTeacherRef {
  id: string;
  user: { id: string; firstName: string; lastName: string };
}

export interface DailyPlan {
  id: string;
  lessonId: string | null;
  groupId: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  topics: DailyPlanTopic[];
  group: DailyPlanGroupRef | null;
  lesson: DailyPlanLessonRef | null;
  teacher: DailyPlanTeacherRef;
}

export interface DailyPlanList {
  items: DailyPlan[];
  total: number;
  take: number;
  skip: number;
}

export interface DailyPlanResourceInput {
  kind: DailyPlanResourceKind;
  title: string;
  link?: string;
  description?: string;
}

export interface DailyPlanTopicInput {
  title: string;
  resources: DailyPlanResourceInput[];
}

export interface CreateDailyPlanInput {
  lessonId?: string;
  groupId?: string;
  date?: string;
  topics: DailyPlanTopicInput[];
}

export interface UpdateDailyPlanInput {
  groupId?: string | null;
  date?: string;
  topics?: DailyPlanTopicInput[];
}

export interface DailyPlanFilters {
  search?: string;
  teacherId?: string;
  groupId?: string;
  lessonId?: string;
  dateFrom?: string;
  dateTo?: string;
  skip?: number;
  take?: number;
}
