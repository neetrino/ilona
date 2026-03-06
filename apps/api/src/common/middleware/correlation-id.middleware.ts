import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContextService } from '../request-context/request-context.service';
import { ServerActivityService } from '../server-activity/server-activity.service';

export const CORRELATION_ID_HEADER = 'x-request-id';

/* Express Request augmentation - namespace required by @types/express */
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly serverActivity: ServerActivityService,
  ) {}

  /** Paths that should not count as "activity" for DB health checks (allows Neon to suspend when idle). */
  private static readonly SKIP_ACTIVITY_PATHS = ['/warmup', '/health/db', '/'];

  use(req: Request, res: Response, next: NextFunction) {
    const path = (req.path ?? '').replace(/\/$/, '') || '/';
    const skipActivity =
      path === '/' ||
      CorrelationIdMiddleware.SKIP_ACTIVITY_PATHS.some((p) => p !== '/' && (path === p || path.endsWith(p)));
    if (!skipActivity) {
      this.serverActivity.touch();
    }
    const id = (req.headers[CORRELATION_ID_HEADER] as string) || uuidv4();
    req.correlationId = id;
    res.setHeader(CORRELATION_ID_HEADER, id);

    const store = {
      requestId: id,
      dbQueryCount: 0,
      dbTimeMs: 0,
    };
    this.requestContext.run(store, () => next());
  }
}

