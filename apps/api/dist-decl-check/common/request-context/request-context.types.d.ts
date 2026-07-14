export interface RequestContextStore {
    requestId: string;
    userId?: string;
    role?: string;
    dbQueryCount: number;
    dbTimeMs: number;
}
