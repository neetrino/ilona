import { DailyPlanTopicInputDto } from './create-daily-plan.dto';
export declare class UpdateDailyPlanDto {
    groupId?: string | null;
    date?: string;
    topics?: DailyPlanTopicInputDto[];
}
