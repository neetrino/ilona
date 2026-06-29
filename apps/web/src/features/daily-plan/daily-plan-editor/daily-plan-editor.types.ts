import type { DailyPlan, DailyPlanResourceKind } from '../types';

export interface DailyPlanEditorProps {
  mode: 'create' | 'edit';
  plan?: DailyPlan;
  initialGroupId?: string;
  initialLessonId?: string;
  readOnly?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export interface DraftResource {
  kind: DailyPlanResourceKind;
  title: string;
  link: string;
  description: string;
}

export interface DraftTopic {
  title: string;
  resources: DraftResource[];
}
