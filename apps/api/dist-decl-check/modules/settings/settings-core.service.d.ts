import type { Cache } from 'cache-manager';
import type { Prisma, SystemSettings } from '@ilona/database';
import { PrismaService } from '../prisma/prisma.service';
export declare class SettingsCoreService {
    private readonly prisma;
    private readonly cache;
    private readonly logger;
    constructor(prisma: PrismaService, cache: Cache);
    invalidateCache(): Promise<void>;
    findCanonicalSystemSettings(): Promise<SystemSettings | null>;
    getSystemSettings(): Promise<SystemSettings>;
    upsertCanonicalSystemSettings(data: Prisma.SystemSettingsUpdateInput): Promise<SystemSettings>;
}
