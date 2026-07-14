export declare class DailyPlanResourceInputDto {
    kind: string;
    title: string;
    link?: string;
    description?: string;
}
export declare class DailyPlanTopicInputDto {
    title: string;
    resources: DailyPlanResourceInputDto[];
}
export declare class CreateDailyPlanDto {
    lessonId?: string;
    groupId?: string;
    date?: string;
    topics: DailyPlanTopicInputDto[];
}
