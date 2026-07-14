import type { RequestContextStore } from './request-context.types';
export declare class RequestContextService {
    private readonly asyncLocalStorage;
    run<T>(store: RequestContextStore, fn: () => T): T;
    getStore(): RequestContextStore | undefined;
}
