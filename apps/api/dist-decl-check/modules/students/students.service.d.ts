import { CreateStudentDto, UpdateStudentDto } from './dto';
import { UserRole, UserStatus, StudentStatus } from '@ilona/database';
import { StudentCrudService } from './student-crud.service';
import { StudentQueryService } from './student-query.service';
import { StudentStatisticsService } from './student-statistics.service';
import { StudentGroupService } from './student-group.service';
import { JwtPayload } from '../../common/types/auth.types';
export declare class StudentsService {
    private readonly crudService;
    private readonly queryService;
    private readonly statisticsService;
    private readonly groupService;
    constructor(crudService: StudentCrudService, queryService: StudentQueryService, statisticsService: StudentStatisticsService, groupService: StudentGroupService);
    findAll(params?: {
        skip?: number;
        take?: number;
        search?: string;
        groupId?: string;
        groupIds?: string[];
        status?: UserStatus;
        statusIds?: UserStatus[];
        teacherId?: string;
        teacherIds?: string[];
        centerId?: string;
        centerIds?: string[];
        lifecycleStatuses?: StudentStatus[];
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        month?: number;
        year?: number;
        currentUserId?: string;
        userRole?: UserRole;
    }): Promise<unknown>;
    findById(id: string, currentUserId?: string, userRole?: UserRole): Promise<unknown>;
    findByUserId(userId: string): Promise<unknown>;
    create(dto: CreateStudentDto, user?: JwtPayload): Promise<unknown>;
    createLinkedToCrmPaidLead(leadId: string, dto: CreateStudentDto, actorUserId: string, user?: JwtPayload): Promise<unknown>;
    update(id: string, dto: UpdateStudentDto, user?: JwtPayload): Promise<unknown>;
    delete(id: string, user?: JwtPayload): Promise<{
        success: boolean;
    }>;
    deleteMany(ids: string[], user?: JwtPayload): Promise<{
        success: boolean;
        deleted: number;
    }>;
    findAssignedToTeacher(teacherId: string, params?: {
        skip?: number;
        take?: number;
        search?: string;
        status?: UserStatus;
        groupId?: string;
    }): Promise<unknown>;
    findAssignedToTeacherByUserId(userId: string, params?: {
        skip?: number;
        take?: number;
        search?: string;
        status?: UserStatus;
        groupId?: string;
    }): Promise<unknown>;
    getMyTeachers(userId: string): Promise<{
        id: string;
        userId: string;
        name: string | undefined;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
    }[]>;
    getStatistics(id: string, currentUserId?: string, userRole?: UserRole): Promise<{
        attendance: {
            total: number;
            present: number;
            absent: number;
            unjustifiedAbsences: number;
            currentStreak: number;
            rate: number;
        };
        recordings: {
            total: number;
            submitted: number;
            rate: number;
        };
        payments: {
            pending: number;
            overdue: number;
            paid: number;
            rate: number;
        };
        feedbacks: number;
        progress: {
            attendanceRate: number;
            recordingRate: number;
            paymentRate: number;
            overall: number;
        };
    }>;
    getMyDashboard(userId: string): Promise<unknown>;
    changeGroup(id: string, newGroupId: string | null, user?: JwtPayload): Promise<unknown>;
}
