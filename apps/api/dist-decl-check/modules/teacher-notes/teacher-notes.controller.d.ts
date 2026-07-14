import { JwtPayload } from '../../common/types/auth.types';
import { CreateTeacherNoteDto } from './dto/create-teacher-note.dto';
import { TeacherNotesService } from './teacher-notes.service';
export declare class TeacherNotesController {
    private readonly service;
    constructor(service: TeacherNotesService);
    list(user: JwtPayload): Promise<{
        teacherId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
    }[]>;
    create(user: JwtPayload, dto: CreateTeacherNoteDto): Promise<{
        teacherId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
    }>;
    remove(user: JwtPayload, id: string): Promise<{
        success: boolean;
    }>;
}
