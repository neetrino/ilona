import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContextService } from '../request-context/request-context.service';
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly requestContext;
    private readonly logger;
    constructor(requestContext: RequestContextService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
