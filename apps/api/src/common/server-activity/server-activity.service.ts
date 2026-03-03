import { Injectable } from '@nestjs/common';

/**
 * Tracks last HTTP request time. Used to skip DB health checks when there is no
 * traffic, so Neon (and similar) can suspend the DB and avoid constant queries.
 */
@Injectable()
export class ServerActivityService {
  private lastActivityAt = 0;

  touch(): void {
    this.lastActivityAt = Date.now();
  }

  getLastActivityAt(): number {
    return this.lastActivityAt;
  }

  /** Returns true if there was any request since the app started (so we do at least one health check). */
  hasEverBeenActive(): boolean {
    return this.lastActivityAt > 0;
  }
}
