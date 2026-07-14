import { CreateLeadDto } from './create-lead.dto';
declare const UpdateLeadDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateLeadDto>>;
export declare class UpdateLeadDto extends UpdateLeadDto_base {
    assignedManagerId?: string;
    transferFlag?: boolean;
    transferComment?: string;
    archivedReason?: string;
}
export {};
