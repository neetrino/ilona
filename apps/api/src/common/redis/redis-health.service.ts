import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { redisRootPrefix } from './redis-keys';
import { isUpstashConfigured, pingUpstashRedis } from './upstash.client';

export type RedisHealthStatus = {
  configured: boolean;
  healthy: boolean;
  latencyMs: number | null;
  keyPrefix: string;
  error?: string;
};

@Injectable()
export class RedisHealthService implements OnModuleInit {
  private readonly logger = new Logger(RedisHealthService.name);
  private lastStatus: RedisHealthStatus = {
    configured: false,
    healthy: false,
    latencyMs: null,
    keyPrefix: redisRootPrefix(),
  };

  async onModuleInit(): Promise<void> {
    this.lastStatus = await this.probe();
    if (!this.lastStatus.configured) {
      this.logger.warn(
        'Upstash Redis env not set — cache and rate limit use in-memory fallbacks',
      );
      return;
    }

    if (this.lastStatus.healthy) {
      this.logger.log(
        `Upstash Redis ready (prefix=${this.lastStatus.keyPrefix}, latency=${this.lastStatus.latencyMs}ms)`,
      );
      return;
    }

    this.logger.error(
      `Upstash Redis unreachable: ${this.lastStatus.error ?? 'unknown error'}`,
    );
  }

  getLastStatus(): RedisHealthStatus {
    return this.lastStatus;
  }

  async checkHealth(): Promise<RedisHealthStatus> {
    this.lastStatus = await this.probe();
    return this.lastStatus;
  }

  private async probe(): Promise<RedisHealthStatus> {
    const keyPrefix = redisRootPrefix();
    if (!isUpstashConfigured()) {
      return {
        configured: false,
        healthy: false,
        latencyMs: null,
        keyPrefix,
        error: 'not_configured',
      };
    }

    const started = Date.now();
    const result = await pingUpstashRedis();
    const latencyMs = Date.now() - started;

    if (!result.ok) {
      return {
        configured: true,
        healthy: false,
        latencyMs,
        keyPrefix,
        error: result.error,
      };
    }

    return {
      configured: true,
      healthy: true,
      latencyMs,
      keyPrefix,
    };
  }
}
