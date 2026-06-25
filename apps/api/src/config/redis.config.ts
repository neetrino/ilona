import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  restUrl: process.env.UPSTASH_REDIS_REST_URL ?? '',
  restToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  enabled: Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  ),
}));
