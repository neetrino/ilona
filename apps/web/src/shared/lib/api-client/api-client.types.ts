export type TokenRefreshCallback = () => Promise<boolean>;
export type SessionExpiredCallback = () => void;
export type TokenGetter = () => string | null;
export type RefreshTokenGetter = () => string | null;

export type FetchOptions = RequestInit & {
  token?: string;
  skipAuthRefresh?: boolean;
  retryCount?: number;
};

export type QueuedRequest<T> = {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  endpoint: string;
  options: FetchOptions;
};

export type TokenReaderDeps = {
  tokenGetter: TokenGetter | null;
  refreshTokenGetter: RefreshTokenGetter | null;
};

export type ApiClientRefreshDeps = {
  baseUrl: string;
  getRefreshCallback: () => TokenRefreshCallback | null;
  getSessionExpiredCallback: () => SessionExpiredCallback | null;
  getToken: () => string | null;
  getRefreshToken: () => string | null;
};
