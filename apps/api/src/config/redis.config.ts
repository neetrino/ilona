import { registerAs } from '@nestjs/config';
import {
  getUpstashRestToken,
  getUpstashRestUrl,
  isUpstashEnvConfigured,
} from '../common/redis/redis-env';

export const redisConfig = registerAs('redis', () => ({
  restUrl: getUpstashRestUrl(),
  restToken: getUpstashRestToken(),
  enabled: isUpstashEnvConfigured(),
}));
