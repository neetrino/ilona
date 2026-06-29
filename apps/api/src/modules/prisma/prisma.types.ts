export interface ConnectionError extends Error {
  code?: string | number;
  cause?: {
    code?: string | number;
    message?: string;
  };
}

export interface ErrLike {
  code?: string | number;
  message?: string;
  cause?: ErrLike;
}

export interface RetryContext {
  op: string;
  meta?: Record<string, unknown>;
}
