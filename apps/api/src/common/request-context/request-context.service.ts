import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import type { RequestContextStore } from './request-context.types';

@Injectable()
export class RequestContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContextStore>();

  run<T>(store: RequestContextStore, fn: () => T): T {
    return this.asyncLocalStorage.run(store, fn);
  }

  getStore(): RequestContextStore | undefined {
    return this.asyncLocalStorage.getStore();
  }
}
