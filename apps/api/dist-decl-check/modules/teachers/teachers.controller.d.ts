import { TeachersService } from './teachers.service';
import { CreateTeacherDto, UpdateTeacherDto, QueryTeacherDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
export declare class TeachersController {
    private readonly teachersService;
    constructor(teachersService: TeachersService);
    findAll(query: QueryTeacherDto, user?: JwtPayload): Promise<unknown>;
    getMyProfile(user: JwtPayload): Promise<unknown>;
    getMyDashboard(user: JwtPayload): Promise<unknown>;
    getDailyPlan(user: JwtPayload, date?: string): Promise<unknown>;
    findById(id: string, user?: JwtPayload): Promise<unknown>;
    getStatistics(id: string, dateFrom?: string, dateTo?: string, user?: JwtPayload): Promise<unknown>;
    getObligationDetails(id: string, user?: JwtPayload): Promise<{
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
    create(dto: CreateTeacherDto, user?: JwtPayload): Promise<unknown>;
    update(id: string, dto: UpdateTeacherDto, user?: JwtPayload): Promise<unknown>;
    deleteMany(body: {
        ids: string[];
    }, user?: JwtPayload): Promise<{
        success: boolean;
        deletedCount: number;
    }>;
    delete(id: string, user?: JwtPayload): Promise<{
        success: boolean;
    }>;
}
