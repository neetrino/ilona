import { PrismaService } from './modules/prisma/prisma.service';
export declare class AppController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRoot(): {
        message: string;
        version: string;
        documentation: string;
        status: string;
    };
    checkDatabaseHealth(): Promise<{
        status: string;
        database: {
            connected: boolean;
            latency: string;
            error?: undefined;
        } | {
            connected: boolean;
            error: string | undefined;
            latency?: undefined;
        };
        timestamp: string;
    }>;
    warmup(): {
        ok: boolean;
    };
}
