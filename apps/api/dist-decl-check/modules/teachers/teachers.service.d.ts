import { CreateTeacherDto, UpdateTeacherDto } from './dto';
import { UserStatus } from '@ilona/database';
import { TeacherCrudService } from './teacher-crud.service';
import { TeacherObligationService } from './teacher-obligation.service';
import { TeacherStatisticsService } from './teacher-statistics.service';
import { JwtPayload } from '../../common/types/auth.types';
export declare class TeachersService {
    private readonly crudService;
    private readonly obligationService;
    private readonly statisticsService;
    constructor(crudService: TeacherCrudService, obligationService: TeacherObligationService, statisticsService: TeacherStatisticsService);
    findAll(params?: {
        skip?: number;
        take?: number;
        search?: string;
        status?: UserStatus;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        currentUser?: JwtPayload;
    }): Promise<unknown>;
    findById(id: string, currentUser?: JwtPayload): Promise<unknown>;
    findByUserId(userId: string): Promise<unknown>;
    create(dto: CreateTeacherDto, currentUser?: JwtPayload): Promise<unknown>;
    update(id: string, dto: UpdateTeacherDto, currentUser?: JwtPayload): Promise<unknown>;
    delete(id: string, currentUser?: JwtPayload): Promise<{
        success: boolean;
    }>;
    deleteMany(ids: string[], currentUser?: JwtPayload): Promise<{
        success: boolean;
        deletedCount: number;
    }>;
    getObligationDetails(teacherId: string, currentUser?: JwtPayload): Promise<{
        total: number;
        completed: number;
        items: {
            key: string;
            label: string;
            done: boolean;
            completedCount: number;
            totalCount: number;
            doneAt: string | undefined;
        }[];
    } | null>;
    getStatistics(id: string, dateFrom?: Date, dateTo?: Date, currentUser?: JwtPayload): Promise<unknown>;
    getMyDashboard(userId: string): Promise<unknown>;
    getDailyPlan(userId: string, date: Date): Promise<unknown>;
}
