import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, QueryStudentDto } from './dto';
import { JwtPayload } from '../../common/types/auth.types';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    findAll(query: QueryStudentDto, user?: JwtPayload): Promise<unknown>;
    getMyProfile(user: JwtPayload): Promise<unknown>;
    getMyDashboard(user: JwtPayload): Promise<unknown>;
    getMyAssignedStudents(user: JwtPayload, query: QueryStudentDto): Promise<unknown>;
    getMyTeachers(user: JwtPayload): Promise<{
        id: string;
        userId: string;
        name: string | undefined;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
    }[]>;
    findById(id: string, user?: JwtPayload): Promise<unknown>;
    getStatistics(id: string, user?: JwtPayload): Promise<{
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
    create(dto: CreateStudentDto, user?: JwtPayload): Promise<unknown>;
    update(id: string, dto: UpdateStudentDto, user?: JwtPayload): Promise<unknown>;
    changeGroup(id: string, groupId: string | null, user?: JwtPayload): Promise<unknown>;
    deleteBulk(body: {
        ids: string[];
    }, user?: JwtPayload): Promise<{
        success: boolean;
        deleted: number;
    }>;
    delete(id: string, user?: JwtPayload): Promise<{
        success: boolean;
    }>;
}
