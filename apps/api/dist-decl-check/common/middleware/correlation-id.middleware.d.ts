import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from '../request-context/request-context.service';
import { ServerActivityService } from '../server-activity/server-activity.service';
export declare const CORRELATION_ID_HEADER = "x-request-id";
declare global {
    namespace Express {
        interface Request {
            correlationId?: string;
        }
    }
}
export declare class CorrelationIdMiddleware implements NestMiddleware {
    private readonly requestContext;
    private readonly serverActivity;
    constructor(requestContext: RequestContextService, serverActivity: ServerActivityService);
    private static readonly SKIP_ACTIVITY_PATHS;
    use(req: Request, res: Response, next: NextFunction): void;
}
