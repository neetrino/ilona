import { UserStatus } from '@ilona/database';
export declare class UpdateManagerDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
    centerId?: string;
    status?: UserStatus;
}
