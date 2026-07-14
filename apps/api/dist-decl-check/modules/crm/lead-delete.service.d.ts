import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { JwtPayload } from '../../common/types/auth.types';
import { LeadReadService } from './lead-read.service';
export declare class LeadDeleteService {
    private readonly prisma;
    private readonly storage;
    private readonly readService;
    constructor(prisma: PrismaService, storage: StorageService, readService: LeadReadService);
    delete(id: string, user?: JwtPayload): Promise<void>;
}
