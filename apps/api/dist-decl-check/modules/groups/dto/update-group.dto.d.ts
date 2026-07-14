import { CreateGroupDto, GroupCalendarPlanDto } from './create-group.dto';
declare const UpdateGroupDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreateGroupDto, "calendarPlan">>>;
export declare class UpdateGroupDto extends UpdateGroupDto_base {
    confirmReplaceGeneratedLessons?: boolean;
    calendarPlan?: GroupCalendarPlanDto | null;
}
export {};
