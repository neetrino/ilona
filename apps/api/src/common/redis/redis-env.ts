/** Strip wrapping quotes some env loaders leave on Windows / nested dotenv. */
export function cleanEnv(value: string | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function getUpstashRestUrl(): string {
  return cleanEnv(process.env.UPSTASH_REDIS_REST_URL);
}

export function getUpstashRestToken(): string {
  return cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function isUpstashEnvConfigured(): boolean {
  const url = getUpstashRestUrl();
  const token = getUpstashRestToken();
  return Boolean(url && token && url.startsWith('https://'));
}
